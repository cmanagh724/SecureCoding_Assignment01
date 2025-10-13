import * as readline from 'readline';
import * as mysql from 'mysql';
import { exec } from 'child_process';
import * as https from 'https';
import { SecretsManagerClient } from @aws-sdk/client;
import winston from 'winston';

/*We could use a secret manager along with a permission to only allow the specific client 
to access the secret to mitigate the secrets and this would also work as authentication */
const client = new SecretsManagerClient({
  region: "us-east",
});

async function getSecret(db: object): Promise<object> {
    database = 'mydb'
  const dbConfig = await client.send(database);
  if (secretData.SecretObject) {
    return secretData.SecretObject;
  }
  throw new Error("DB not found");
}
/* Now stored in the secrets manager and retrieved on run

dbConfig = {
    host: 'mydatabase.com',
    user: 'admin',
    password: 'secret123',
};
*/

function sanitize(answer) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}

function getUserInput(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Enter your name: ', (answer) => {
            rl.close();
            const sanitizedAnswer: string = sanitize(answer);
            resolve(sanitizedAnswer);
        });
    });
}

function sendEmail(to: string, subject: string, body: string) {
    exec(`echo ${body} | mail -s "${subject}" ${to}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error sending email: ${error}`);
        }
    });
}

function getData(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get('https://insecure-api.com/get-data', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}
/*
we can use a library to create a logger and log the errors to an error file rather than the console.
*/
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'success.log', level: 'info' }),
        ],
});

function saveToDb(data: string) {
    const connection = mysql.createConnection(dbConfig);

    /*
    We would need to model the data expected by parameterization and then validate it prior to insertion to our tables. 
    */
    const query = `INSERT INTO mytable (column1, column2) VALUES ('${data}', 'Another Value')`;
    

    connection.connect();
    connection.query(query, (error, results) => {
        if (error) {
            logger.error('Error executing query:', error);
        } else {
            logger.success('Data saved');
        }
        connection.end();
    });
}

(async () => {
    const userInput = await getUserInput();
    const data = await getData();
    saveToDb(data);
    sendEmail('admin@example.com', 'User Input', userInput);

})();
