const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Load client secrets from a local file.
const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000/oauth2callback");


const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('Authorize this app by visiting this url:', authUrl);

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  res.send('Authentication successful! You can close this tab.');
});




app.post('/create-meeting', async (req, res) => {
    const { startTime, endTime } = req.body; 
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' });
    }
  
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
    const event = {
      summary: 'Google Meet Meeting',
      start: {
        dateTime: startTime,
        timeZone: 'America/Los_Angeles', // Adjust the timezone as necessary
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Los_Angeles',
      },
      conferenceData: {
        createRequest: {
          requestId: 'random-string',
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };
  
    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });
      console.log('API Response:', response.data);

      const meetingLink = response.data.conferenceData.entryPoints[0].uri;
      const meetingId = meetingLink.split('/').pop();
  
      res.status(200).json({ meetingLink, meetingId });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).send('Error creating meeting');
    }
  });
  
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
