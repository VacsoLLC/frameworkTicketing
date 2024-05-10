//import Table from "../../table.js";
import { Table } from "frameworkbackend";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Handlebars from "handlebars";

export default class Ticket extends Table {
  constructor(args) {
    super({ name: "Ticket", table: "ticket", ...args });

    this.addColumn({
      columnName: "created",
      friendlyName: "Created",
      columnType: "datetime",
      hiddenCreate: true,
      readOnly: true,
      onCreate: () => {
        return Date.now();
      },
    });

    this.addManyToOne({
      referencedTableName: "user",
      referencedDb: "core",
      columnName: "requester",
      helpText: "User who requested the ticket",
      displayColumns: [
        {
          columnName: "name",
          friendlyName: "Requester",
          listStyle: "nowrap",
        },
      ],

      tabName: "Tickets Opened",
      defaultValue: ({ user }) => {
        return user.id;
      },
      index: true,
    });

    this.addColumn({
      columnName: "subject",
      friendlyName: "Subject",
      columnType: "string",
      index: true,
      helpText: "Subject or Title of the ticket",
    });

    this.addColumn({
      columnName: "body",
      friendlyName: "Body",
      columnType: "string",
      index: true,
      helpText: "Body of the ticket",
      fieldType: "html", //'textArea',
    });

    this.addManyToOne({
      referencedTableName: "group",
      referencedDb: "core",
      columnName: "group",
      helpText: "Group the ticket is assigned to",
      displayColumns: [
        {
          columnName: "name",
          friendlyName: "Group",
          listStyle: "nowrap",
        },
      ],
      tabName: "Tickets Assigned",
      index: true,
    });

    // Example usage with custom column name and displayColumns (though displayColumns isn't directly utilized in schema creation)
    this.addManyToOne({
      referencedTableName: "user",
      referencedDb: "core",
      columnName: "assignedTo",
      helpText: "User the ticket is assigned to",
      displayColumns: [
        {
          columnName: "name",
          friendlyName: "Assigned To",
          listStyle: "nowrap",
        },
      ],

      tabName: "Tickets Assigned",
      defaultValue: ({ user }) => {
        return user.id;
      },
      index: true,
    });

    this.addColumn({
      columnName: "status",
      friendlyName: "Status",
      //columnType: 'string',
      index: true,
      helpText: "Status of the ticket",
      defaultValue: "Open",
      fieldType: "select",
      options: ["Open", "Closed", "Pending Feedback", "Feedback Received"],
    });

    // TODO: document this use case... comment is a generic table that can be reused... addManyToOne should be used when ever possible, and it automatically calls add child
    // TODO: build a better fucntion for this...
    this.addChild({
      db: "core", // db name we want to make a child
      table: "comment", // table name we want to make a child
      columnmap: {
        // key is the column name in the child table, value is from the parent table. Only db, table and id are availible options at this time from the parent
        db: "db",
        table: "table",
        row: "id",
      },
      tabName: "Comments",
    });

    this.addChild({
      db: "core", // db name we want to make a child
      table: "time", // table name we want to make a child
      columnmap: {
        // key is the column name in the child table, value is from the parent table. Only db, table and id are availible options at this time from the parent
        db: "db",
        table: "table",
        row: "id",
      },
      tabName: "Time",
    });

    this.addColumn({
      columnName: "emailConversationId",
      friendlyName: "Email Conversation Id",
      columnType: "string",
      index: true,
      hidden: true,
      helpText: "Used to map incoming emails to tickets.",
    });

    this.addColumn({
      columnName: "emailId",
      friendlyName: "Email ID",
      columnType: "string",
      index: true,
      hidden: true,
      helpText: "ID of last email receieved. Used to send replies.",
    });

    this.addColumn({
      columnName: "emailProvider",
      friendlyName: "Email Provider",
      columnType: "string",
      hidden: true,
      helpText: "The email provider being used to communicate with the user.",
    });

    this.addMenuItem({
      label: "Tickets",
      view: null,
      order: 1,
      icon: "pi-ticket",
    });

    this.addMenuItem({
      label: "All Tickets",
      parent: "Tickets",
      icon: "pi-list",
      order: 99,
    });

    this.addMenuItem({
      label: "My Tickets",
      parent: "Tickets",
      filter: (req) => {
        return [{ assignedTo: req.user?.id }, ["status", "!=", "Closed"]];
      },
      icon: "pi-user",
      order: 1,
    });

    this.addMenuItem({
      label: "My Group's Tickets",
      parent: "Tickets",
      filter: (req) => {
        return [["group", "IN", req.user?.groups]];
      },
      icon: "pi-users",
      order: 2,
    });

    this.addAction({
      label: "Assign to Me",
      method: "assignToMe",
      verify: "Assign this ticket to yourself?",
      helpText: "Assign this ticket to yourself.",
    });

    this.addAction({
      label: "Request Feedback",
      method: "requestFeedback",
      helpText: "Request feedback from the user.",
      verify:
        'Provide a commment to the user requesting additional information. The comment will be sent to the user and the ticket will be updated to "Feedback Requested" status.',
      inputs: {
        Comment: {
          fieldType: "textArea",
          required: true,
        },
        Minutes: {
          fieldType: "number",
          required: true,
        },
      },
    });

    this.addAction({
      label: "Public Update",
      method: "publicUpdate",
      verify: "The comment will be sent to the user.",
      helpText: "Add a public comment to the ticket.",
      inputs: {
        Comment: {
          fieldType: "textArea",
          required: true,
        },
        Minutes: {
          fieldType: "number",
          required: true,
        },
      },
    });

    this.addAction({
      label: "Private Update",
      method: "privateUpdate",
      verify: "The comment will not be sent to the user.",
      helpText: "Add a private comment to the ticket.",
      inputs: {
        Comment: {
          fieldType: "textArea",
          required: true,
        },
        Minutes: {
          fieldType: "number",
          required: true,
        },
      },
    });

    this.addAction({
      label: "Time Entry",
      method: "timeEntry",
      verify: "Add a time entry to this ticket? Time is entered in minutes.",
      helpText: "Add a time entry to this ticket.",
      inputs: {
        Minutes: {
          fieldType: "number",
          required: true,
        },
      },
    });

    this.addAction({
      label: "Close Ticket",
      method: "closeTicket",
      helpText: "Close this ticket.",
      verify:
        "Provide a commment to the user explaining why the ticket is being closed. The comment will be sent to the user and the ticket will be updated to closed status.",
      inputs: {
        Comment: {
          fieldType: "textArea",
          required: true,
        },
        Minutes: {
          fieldType: "number",
          required: true,
        },
      },
    });

    this.addInit(() => {
      this.dbs.core.event.on("email", async (email) => {
        await this.createFromEmail(email);
      });

      // example of how to listen to all events. Listern contains an event property that indicates what event was triggered
      const listener = this.dbs.core.event.on("**", async (args) => {
        console.log("event", listener, args);
      });

      this.dbs.core.event.on(
        "core.comment.recordCreate.after",
        async ({ data, req }) => {
          console.log("recordCreate.after", data);
          await this.emailComment(data, req);
        }
      );
    });

    this.addInit(async () => {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      this.templates = {};

      this.templates.subject = await this.compileTemplate(
        //'src\\backend\\lib\\db\\databases\\core\\email\\templates\\subject.hbs'
        path.join(__dirname, "ticket", "subject.hbs")
      );
      this.templates.body = await this.compileTemplate(
        //'src\\backend\\lib\\db\\databases\\core\\email\\templates\\body.hbs'
        path.join(__dirname, "ticket", "body.hbs")
      );
    });
  }

  async emailComment(args, req) {
    console.log("comment", args);

    if (args && args.type === "Private") {
      // We dont want to send emails for private comments
      return args;
    }

    if (args.author == "0") {
      // We dont want to send emails for system comments
      return args;
    }

    args.record = await this.dbs[args.db][args.table].recordGet({
      where: { id: args.row },
    });

    const user = await this.dbs.core.user.recordGet({
      recordId: args.record.requester,
    });

    if (!user) {
      throw new Error("No user found! Can not send email");
    }

    const email = {};
    email.body = this.templates.body(args);
    email.subject = this.templates.subject(args);
    email.to = user.email;
    email.emailId = args.record.emailId;
    email.emailConversationId = args.record.emailConversationId;

    const results = await this.dbs.core.email.sendEmail({
      email,
      provider: args.record.emailProvider || this.config.email.defaultMailbox,
    });

    if (results && results.emailId && results.emailConversationId) {
      await this.dbs[args.db][args.table].recordUpdate({
        recordId: args.record.id,
        data: {
          emailId: results.emailId,
          emailConversationId: results.emailConversationId,
        },
        req,
      });
    }

    return results;
  }

  async timeEntry({ recordId, Minutes, req }) {
    await this.dbs.core.time.createEntry({
      req,
      db: this.db,
      table: this.table,
      recordId,
      seconds: Minutes * 60,
    });
    return {};
  }

  async assignToMe({ recordId, req }) {
    await this.recordUpdate({
      recordId,
      data: {
        assignedTo: req.user.id,
      },
      req,
    });
    return {};
  }

  async publicUpdate({ recordId, Comment, Minutes, req }) {
    await this.dbs.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment: Comment,
      type: "Public",
    });

    if (Minutes) {
      this.timeEntry({ recordId, Minutes, req });
    }

    return {};
  }

  async privateUpdate({ recordId, Comment, Minutes, req }) {
    await this.dbs.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment: Comment,
      type: "Private",
    });

    if (Minutes) {
      this.timeEntry({ recordId, Minutes, req });
    }

    return {};
  }

  async requestFeedback({ recordId, Comment, Minutes, req }) {
    await this.commentAndChangeStatus({
      recordId,
      comment: Comment,
      status: "Pending Feedback",
      req,
    });

    if (Minutes) {
      this.timeEntry({ recordId, Minutes, req });
    }

    return {};
  }

  async closeTicket({ recordId, Comment, Minutes, req }) {
    await this.commentAndChangeStatus({
      recordId,
      comment: Comment,
      status: "Closed",
      req,
    });

    if (Minutes) {
      this.timeEntry({ recordId, Minutes, req });
    }

    return {};
  }

  async commentAndChangeStatus({
    recordId,
    comment,
    status,
    type = "Public",
    req,
  }) {
    if (!comment) {
      throw new Error("Comment is required.");
    }

    await this.dbs.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment,
      type,
    });

    await this.recordUpdate({ recordId, data: { status }, req });
  }

  async createFromEmail(message) {
    if (message.emailConversationId) {
      const record = await this.recordGet({
        where: {
          emailConversationId: message.emailConversationId,
        },
      });

      if (record) {
        console.log("Found existing ticket, adding comment.", record);
        this.dbs.core.comment.createComment({
          req: {
            user: {
              id: "0",
            },
            action: "Ticket Note from Email",
          },
          db: this.db,
          table: this.table,
          recordId: record.id,
          comment: message.body,
          type: "Public",
        });

        this.recordUpdate({
          recordId: record.id,
          data: {
            status: "Feedback Received",
            emailId: message.emailId,
          },
          req: {
            user: {
              id: "0",
            },
            action: "Ticket Note from Email",
          },
        });

        return;
      }
    }

    const user = await this.dbs.core.user.getUserOrCreate(message.from);

    // TODO build an config option to create user if not found, create ticket with no requester, or reject email
    //if (!user) {
    //  throw new Error('User not found. Cannot create ticket from email.'); // TODO optionally create user or send reject email
    //}

    await this.recordCreate({
      data: {
        subject: message.subject,
        body: message.body,
        requester: user?.id,
        status: "Open",
        group: message.assignmentGroup,
        emailConversationId: message.emailConversationId,
        emailId: message.emailId,
        emailProvider: message.emailProvider,
      },
      // TODO: need a better way of calling table functions from a/as a system user
      req: {
        user: {
          id: "0",
        },
        action: "Ticket Create from Email",
      },
    });
  }

  async compileTemplate(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, source) => {
        if (err) reject(err);
        else resolve(Handlebars.compile(source));
      });
    });
  }
}
