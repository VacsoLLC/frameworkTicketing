# Vacso Framework Ticketing

Welcome to Vacso Framework Ticketing, an open-source ticketing system designed for enterprise IT departments.

Framework Ticketing is an application built on top of frameworkBackend and frameworkFrontend. Framework is designed for you to build internal enterprise applications quickly and easily.

## Demo Video

[![Framework Ticketing Demo Video](https://github.com/user-attachments/assets/cc1cd286-e205-48c6-ad4a-2a5230a41891)](https://www.youtube.com/watch?v=zhe9Z-5WU1s)
https://www.youtube.com/watch?v=zhe9Z-5WU1s

## Live Demo

https://demo.vacso.com

| Demo Username       | Demo Password                                |
| ------------------- | -------------------------------------------- |
| admin               | cqo3exSuvwx8mxqeKtltdbLWYrWS6WO3XdXJeP5w3Ik= |
| resolver@vacso.com  | cqo3exSuvwx8mxqeKtltdbLWYrWS6WO3XdXJeP5w3Ik= |
| requester@vacso.com | Vacso123!                                    |

To create tickets via email send an email to: demo@vacso.com. Warning: your email address will be added to the system for others to see. Use a burner account.

All outbound emails are disabled in the demo.

## WARNING: Beta!

Framework Ticketing is pre-release. It is under active development and should be used with caution.

## Features

- Automatic ticket create and update from emails
- Self-service customer portal
- Single sign-on integration (SAML)
- User sync from external directory (Microsoft 365/Entra)
- AI-powered vector embedding search
- Time tracking

## Install

### Getting Started

**STOP!** If you are going to contribute to the development of frameworkTicketing or its components, please skip to the contributing section.

To begin using the Vacso Framework Ticketing, follow these steps:

#### Install prereqs

This was tested on a fresh install of Ubuntu 24. You can use any up to date linux with slightly modified commands.

```bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get -y install git docker.io docker-compose-v2
```

Follow the instructions here to install docker: https://docs.docker.com/engine/install/ubuntu/

#### Clone the Repsitory

Start by cloning the Vacso Framework repository to your local machine.

```bash
git clone https://github.com/vacsollc/frameworkTicketing.git
```

#### Generate and update enivorment variables

Creates random passwords and secrets for operation. Edit the file and update the DOMAIN_NAME and CERTBOT_EMAIL variables.

Unix

```bash
cd backend
bash ./generate_env.sh
more .env
cd ..
```

Windows

```cmd
cd backend
powershell ./generate_env.ps1
more .env
cd ..
```

#### Modify the config

check out the files in /backend/config and update as nessary.

#### Start the containers

```bash
cd docker
docker compose up
```

#### Login to the app

Go to http://yourserverip/. You can find the random password for admin in the .env file.

### SSL Certificates

The provided docker compose will automatically create a self signed certificate. Then it will attempt to obtain a certificate from Let's Encrypt to replace the self signed certificate. This process takes a couple of minutes. If you still have a self signed cert after 5 minutes, there has been a failure and check the logs of the certbot container. Internet accessability on port 80 is required for Let's Encrypt to work.

The Let's Encrypt SSL cert will be automatically renewed and replaced as nessesary.

### Setup Backups

If using the provided docker compose, MariaDB is automatically backed up to the folder /docker/backup/mariadb nightly. Backing up that directory, your .env file, and the /backend/config directory should be everything you need.

### Setup Monitoring

To monitor up time, the Node API backend provides a health check endpoint at /api/core/healthcheck/status. Use a monitoring tool to poll it every minute searching for "API is healthy". If there is an error but data can be returned "API failed" will be returned.

The status endpoint pulls the system user record from the user table to test connectivity and functionality of the DB server.

### Setup Email

#### Microsoft

Create a shared mailbox in Microsoft Exchange to be used for sending and recieving emails. Note its email address and add it to your env file. See .env.example.

1. Login to the Microsoft Entra admin portal
1. Go to Applications->Enterprise Applications
1. Click "New Application"
1. Click "Create your own Application"
1. Enter an App name, and choose "Intergrate any other application you dont find in the gallery (Non-gallery)"
1. Click "Create"
1. On the newly created app, go to Security->Permissions
1. Click on "Application registration" (This is a link after the sentence "To configure a requested permissions for apps you own, use the app registration"). This will send you to the "API Peermissions" page for your app.
1. Click "Add a permission". The "Request API permissions" panel will open
1. Click "Microsoft Graph"
1. Click "Application Permissions"
1. Search for "Mail"
1. Expand the section called "Mail"
1. Check the box next to all 5 permissions in the "Mail" section including "Mail.Read" and "Mail.Send"
1. NOTE: If you want to sync users from Microsoft 365, you'll need to add the "Directory.Read.All" permission as well. See the "Setup User Sync" section.
1. Click "Add permissions"
1. At the top of the list of permissions, click "Grant admin consent for..." button.
1. Click "Yes" confirm you want to grant admin consent.
1. Go ot the "Overview" tab of the app registration.
1. Copy the Application (client) ID and Directory (tenant) ID into your env file.
1. Go to the "Certificates & secrets" tab of hte app registration
1. Under "Client Secrets" click "New client secret".
1. Add a description and an expriation date for your secret and click "Add"
1. Copy your secret into your env file. WARNING: this will be the only time you will be able to obtain this secret. If you loose it you'll need to create a new one.

This API client id will have access to all mailboxes in Microsoft Exchange. To restrict its access to specific mailboxes, follow the insutrctions found here: https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access

#### Google

Supported. Instructions coming soon.

### Setup User Sync

The user sync uses the Microsoft Graph API to sync users from your Microsoft 365/Entra tenant into frameworkTicketing.

To configure the sync, you'll need to setup an Enterprise Application and App registration, as sepcified in the email setup (You can use the same App registration as the one used for the email setup).

You must give the "App Registration" the "Directory.Read.All" permission. Don't forget to hit the "Grant admin conset for..." button.

By default the config file uses the same enviorment varaibles for the Microsoft Graph API as the email setup. If you want to use a different App registration, you'll need to update the config file.

Make sure the the enviorment varaible SYNC_USERS= is set to 1. See the env.example file.

Users are synced every 6 hours. To force a user sync, you can access the following URL (Login to frontend first): /core/usersync/action/sync/1

### Setup Single Sign On via SAML

#### Microsoft

1. Open the Enterprise application created for email. If not using Microsoft for email, follow steps 1 through 6.
1. Go to the Manage->Single Sign On page inside the enterprise application.
1. Under "Select a single sign-on method" click SAML.
1. In section #1, "Basic SAML Configuration", click Edit.
1. Under Identifier (Entity ID), click "Add Identifier"
1. Type in a unique identifier. It can be anything. This must match your 'entity' in the framework SAML config.
1. Under "Reply URL (Assertion Consumer Service URL)", click "Add reply URL" and add your reply URL. This URL is the URL Microsoft will post the signed SAML assertion after the user is authenticated.
   1. Your URL should be in the format: https://<_your domain_>/api/core/saml/acs/<_saml key_>
   1. Replace <_your domain_> with your domain name. This does not need to be publicly accessable but must be accessible by the user.
   1. Replace <_saml key_> with the key you used in the /backend/config/saml.js config. In the example config this would be ms or google.
1. Click "Save" at the top.
1. In section 3, "SAML Certificates", download the Certificate (Base64). Copy and paste the contents of this file into the certificates key in /backend/config/saml.js config.
1. In section 4, "Set up <_Name you gave the enterprise app_>", copy the "Login URL". Paste this into the loginUrl key in /backend/config/saml.js. This is the URL framework will send the user to to authenticate them before they are sent back to the Reply URL.

#### Google

Supported. Instructions coming soon.

## Inbound call web pops

To use inbound call web pops, have your phone system launch the following webpage when a call comes in: https://<yourdomain>/core/user/action/findUserByPhoneNumber/<phone number>.

Framework will look up that phone number exactly. If a match is found, you will be forwarded to that user's user record.

To configure this in Microsoft Teams Phone:

1. Go to https://www.microsoft365.com/, login as a 365 admin, and click "Admin" icon on the left hand side.
1. Click "... Show All" in the left hand menu.
1. In "Admin centers" click "Teams"
1. Inside the teams console, expand the "Voice" menu
1. Click "Calling Policies"
1. To configure for everyone, click "Global (Org-wide default)"
1. Near the bottom of the policy, find "Open apps in browser for incoming PSTN calls" and turn it on.
1. Find "URL to open apps in browser for incoming PSTN calls" in the policy. Enter in the URL https://<yourdomain>/core/user/action/findUserByPhoneNumber/{phone}.
1. Click "Save"
1. Every user must enable the option in thier settings. 
1. In the teams client for Windows, click the 3 horizontal dots in the top right, then click "Settings"
1. Click "Calls"
1. Under "Open apps in browser" it says "Allow third party apps to automatically open in a new browser window for incoming PSTN calls.", move the slider so it is on.

Go more information, see: 

1. Admin setup: https://learn.microsoft.com/en-us/microsoftteams/inbound-call-routing
1. User setup: https://support.microsoft.com/en-us/office/manage-your-call-settings-in-microsoft-teams-456cb611-3477-496f-b31a-6ab752a7595f



## Documentation

## Contributing

Vacso Framework Ticketing is an open-source project, and we welcome contributions from the community.

To develop you'll need to:

- Checkout frameworkBackend, frameworkFrontend, and frameworkTicketing into the same folder (IE /devel/frameworkTicketing, /devel/frameworkBackend, /devel/frameworkFrontend).
- Then use "Open workspace from file" in VS Code to open frameworkTicketing/framework.code-workspace.
- in frameworkBackend run "yarn install" and "yarn link"
- in framworkFrontend run "yarn install" and "yarn link"
- In framworkTicketing/frontend run "yarn install" and "yarn link @vacso/frameworkFrontend"
- In frameworkTicketing/backend run "yarn install" and "yarn link @vacso/frameworkBackend". Also generate the .env file here using the powershell or shell script in that directory
- In the frameworkTicketing/docker container, startup just the mariadb container with docker-compose up -d mariadb

This should give you a development enviorment where you can make changes and test any of the 3 packages.

On windows you can just copy and paste this into a command prompt assuming you have git, yarn, docker desktop and vscode installed.

```
mkdir framework
cd framework
git clone https://github.com/VacsoLLC/frameworkTicketing.git
git clone https://github.com/VacsoLLC/frameworkBackend.git
git clone https://github.com/VacsoLLC/frameworkFrontend.git
cd frameworkBackend
yarn install
yarn link
cd ..
cd frameworkFrontend
yarn install
yarn link
cd ..
cd frameworkTicketing
cd backend
yarn install
yarn link @vacso/frameworkBackend
powershell -f generate_env.ps1
cd ..
cd frontend
yarn install
yarn link @vacso/frameworkFrontend
cd ..
cd docker
docker compose up mariadb -d
cd ..
code frameworkTicketing.code-workspace
```

marqo is needed for search but uses a lot of ram, cpu and downloads gigs on first startup. So only start it if you're developing around search:

```
cd docker
docker compose up marqo -d
```

In vscode, go to the "Run and Debug" tab and click play on the "Everything" option. This starts up Vite, Node and a Chrome browser to debug in.

To login to the app, use the username admin and the password from the .env file.

## Troubleshooting first start

If you are having any problems with the backend reaching the database, you can do the following (This deletes all data in your database!)

```
# Go to framework ticketing docker directory
cd framworkTicketing/docker
# Shut down and destroy MariaDB conatiner
docker compose down MariaDB
# delete all data for MariaDB. WARNING: this wipes all your data in MariaDB!
rm ./data/mariadb
# Start the maraidb container back up... give it 10 seconds to start and create the database and user.
docker compose up mariadb -d
# Make sure its up and running
docker ps
# This prints the password for the framework user
docker exec -i -t docker-mariadb-1 bash -c "export | grep MARIADB_PASSWORD"
# copy/paste the password after running this
docker exec -i -t docker-mariadb-1 mariadb -u framework -p
# If you got a "MariaDB[(none)]>" prompt, its working
```

## Support

If you encounter any issues or have questions regarding the Vacso Framework Ticketing, please file an issue on our [GitHub repository](https://github.com/vacsollc/framework/issues).

## License

Vacso Framework is licensed under the [MIT License](LICENSE).

---

Vacso Framework Ticketing is a project by Vacso, LLC.

```

```
