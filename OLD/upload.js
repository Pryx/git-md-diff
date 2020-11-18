const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
import yargs from 'yargs';

var argv = yargs
  .scriptName("upload.js")
  .usage('Usage: $0 <command> [args]')
  .command(
    'upload',
    'Run the upload script on provided files',
    {
      f: {
        demand: true,
        string: true
      },
      n: {
        demand: false,
        string: true
      }
    },
    (argv) => {
        upload();
    }
  )
  .command(
    'cleanup',
    'Cleanup berfore file upload',
    {},
    (argv) => {
        cleanup();
    }
  )
  .help('h')
  .alias('h', 'help')
  .alias('f', 'file')
  .nargs('f', 1)
  .describe('f', 'File to upload')
  .alias('c', 'commit')
  .nargs('c', 1)
  .describe('c', 'Commit the file belongs to')
  .alias('n', 'name')
  .nargs('n', 1)
  .describe('n', 'Name of the document on google drive')
  .describe('markdown', 'Convert markdown to HTML')
  .argv



// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

function upload(){
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), runUpload);
    });
}

function cleanup(){
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), runCleanup);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

async function runCleanup(auth) {
    global.drive = google.drive({ version: 'v3', auth });

    let diff_root = await getFolderId("git-md-diff", 'root');

    let folder = await getFolderId(argv.commit, diff_root);    
    
    if (folder){
        await deleteFile(folder, drive);
    }
}


async function runUpload(auth) {
    global.drive = google.drive({ version: 'v3', auth });

    let diff_root = await getFolderId("git-md-diff", 'root');

    let folder = null;

    folder = await getFolderId(argv.commit, diff_root);

    var content = fs.readFileSync(argv.file, 'utf8');


    //console.log(original, changed);
    await createDocument(folder, argv.name, content);


    //application/vnd.google-apps.document
}


async function getFolderId(folder, parent) {
    // Check File exists
    let response = await drive.files.list({
        pageSize: 10,
        q: `mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false and name='${folder}'`,
        fields: 'files(id, name)',
    });

    var files = response.data.files;

    if (!files || files.length == 0) {
        var fileMetadata = {
            'name': folder,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent]
        };
        let file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });

        //console.log('Folder Id: ', file.data.id);
        return file.data.id;
    } else {
        let folder = files.pop();

        return folder.id;
    }
}


async function deleteFile(fileId) {
    var request = await drive.files.delete({
        'fileId': fileId
    });
    return request;
}

async function createDocument(folder, name, body) {
    var fileMetadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.document',
        'parents': [folder],
    };
    var media = {
        mimeType: 'text/html',
        body: body
    };

    drive.files.create(
        {
            resource: fileMetadata,
            fields: 'id',
            media: media
        },
        function (err, file) {
            if (err) {
                // Handle error
                console.error(err);
            }
        }
    );
}