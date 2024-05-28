# Vacso frameworkTicketing

Welcome to Vacso frameworkTicketing, an open-source ticketing system designed for enterprise IT departments.

frameworkTicketing is an application built on top of frameworkBackend and frameworkFrontend. Framework is designed for you to build internal enterprise applications quickly and easily.

## WARNING: Alpha!

frameworkTicketing is alpha level code. It is under active development and should not be used in production at this time.

## Features

- **SAML Single Sign-On (SSO)**: Integrated SSO capabilities for secure and convenient user authentication, supporting widely-used services like Microsoft Azure AD and Google Workspace.
- **Email Integration**: Seamlessly connect with Microsoft Exchange Online and Google Gmail for email functionalities within your applications.

## Install

### Getting Started

To begin using the Vacso frameworkTicketing, follow these steps:

#### Clone the Repsitory

Start by cloning the Vacso Framework repository to your local machine.

```bash
git clone https://github.com/vacsollc/frameworkTicketing.git
```

#### Install Dependencies

Navigate to the cloned directory and install the necessary dependencies for the frontend and backend

```bash
cd frameworkTicketing
cd backend
yarn install
cd ..
cd backend
yarn install
cd ..
```

#### Generate enivorment variables

Creates random passwords and secrets for operation.

Unix

```bash
cd docker
./generate_env.sh
more .env
cd ..
```

Windows

```cmd
cd docker
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

#### Google

Support. Instructions coming soon.

## Documentation

## Contributing

Vacso frameworkTicketing is an open-source project, and we welcome contributions from the community. If you're interested in contributing, please read our [contributing guidelines](#) for more information.

To develop you'll need to checkout frameworkBackend, frameworkFrontend, and frameworkTicketing into the same folder (IE /devel/frameworkTicketing, /devel/frameworkBackend, /devel/frameworkFrontend). Then use "Open workspace from file" to open frameworkTicketing/framework.code-workspace. You'll need to run "yarn install" and "yarn link" in backend and frontend. In ticketing, run "yarn install", "yarn link @vacso/frameworkFrontend", "yarn link @vacso/frameworkBackend".

## Support

If you encounter any issues or have questions regarding the Vacso Framework, please file an issue on our [GitHub repository](https://github.com/vacsollc/framework/issues).

## License

Vacso Framework is licensed under the [MIT License](LICENSE).

---

Vacso frameworkTicketing is a proud project by Vacso, LLC. We are committed to providing developers with tools that make building enterprise applications more efficient and enjoyable. Happy coding! 🚀

```

```
