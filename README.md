# Vacso frameworkTicketing

Welcome to Vacso frameworkTicketing, an open-source ticketing system designed for enterprise IT departments.

frameworkTicketing is an application built on top of frameworkBackend and frameworkFrontend. Framework is designed for you to build internal enterprise applications quickly and easily.

## WARNING: Alpha!

frameworkTicketing is alpha level code. It is under active development and should not be used in production at this time.

## Features

- **SAML Single Sign-On (SSO)**: Integrated SSO capabilities for secure and convenient user authentication, supporting widely-used services like Microsoft Azure AD and Google Workspace.
- **Email Integration**: Seamlessly connect with Microsoft Exchange Online and Google Gmail for email functionalities within your applications.

## Demo

https://demo.vacso.com

| Demo Username       | Demo Password                                |
| ------------------- | -------------------------------------------- |
| admin               | zHZcLVvOix1xHhpKpIy3XjhBxKo7bpx9FuO+HjSrU7U= |
| resolver@vacso.com  | zHZcLVvOix1xHhpKpIy3XjhBxKo7bpx9FuO+HjSrU7U= |
| requester@vacso.com | zHZcLVvOix1xHhpKpIy3XjhBxKo7bpx9FuO+HjSrU7U= |

To create tickets via email send an email to: demo@vacso.com. Warning: your email address will be added to the system for others to see. Use a burner account.

All outbound emails are disabled in the demo.

## Install

### Getting Started

To begin using the Vacso frameworkTicketing, follow these steps:

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
1. Click "Add permissions"
1. At the top of the list of permissions, click "Grant admin consent for Vacso"
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

Support. Instructions coming soon.

## Documentation

## Contributing

Vacso frameworkTicketing is an open-source project, and we welcome contributions from the community. If you're interested in contributing, please read our [contributing guidelines](#) for more information.

To develop you'll need to:

- Checkout frameworkBackend, frameworkFrontend, and frameworkTicketing into the same folder (IE /devel/frameworkTicketing, /devel/frameworkBackend, /devel/frameworkFrontend).
- Then use "Open workspace from file" in VS Code to open frameworkTicketing/framework.code-workspace.
- in frameworkBackend run "yarn install" and "yarn link"
- in framworkFrontend run "yarn install" and "yarn link"
- In framworkTicketing/frontend run "yarn link @vacso/frameworkFrontend", and "yarn install"
- In frameworkTicketing/backend run "yarn link @vacso/frameworkBackend", and "yarn install".

This should give you a development enviorment where you can make changes and test any of the 3 packages.

## Support

If you encounter any issues or have questions regarding the Vacso Framework, please file an issue on our [GitHub repository](https://github.com/vacsollc/framework/issues).

## License

Vacso Framework is licensed under the [MIT License](LICENSE).

---

Vacso frameworkTicketing is a proud project by Vacso, LLC. We are committed to providing developers with tools that make building enterprise applications more efficient and enjoyable. Happy coding! 🚀

```

```
