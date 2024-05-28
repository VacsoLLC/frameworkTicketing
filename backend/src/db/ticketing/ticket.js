//import Table from "../../table.js";
import { Table } from "@vacso/frameworkbackend";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Handlebars from "handlebars";

export default class Ticket extends Table {
  constructor(args) {
    super({ name: "Ticket", className: "ticket", ...args });

    this.columnAdd({
      columnName: "created",
      friendlyName: "Created",
      columnType: "datetime",
      hiddenCreate: true,
      readOnly: true,
      onCreate: () => {
        return Date.now();
      },
    });

    this.manyToOneAdd({
      referencedTableName: "user",
      referencedDb: "core",
      referenceCreate: true,

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

    this.columnAdd({
      columnName: "subject",
      friendlyName: "Subject",
      columnType: "string",
      index: true,
      helpText: "Subject or Title of the ticket",
    });

    this.columnAdd({
      columnName: "body",
      friendlyName: "Body",
      columnType: "text",
      index: true,
      helpText: "Body of the ticket",
      fieldType: "html", //'textArea',
    });

    this.manyToOneAdd({
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
    this.manyToOneAdd({
      referencedTableName: "user",
      referencedDb: "core",
      queryModifier: "ticketing.ticket.resolver",
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

    this.columnAdd({
      columnName: "status",
      friendlyName: "Status",
      //columnType: 'string',
      index: true,
      helpText: "Status of the ticket",
      defaultValue: "Open",
      fieldType: "select",
      options: ["Open", "Closed", "Pending Feedback", "Feedback Received"],
    });

    // TODO: document this use case... comment is a generic table that can be reused... manyToOneAdd should be used when ever possible, and it automatically calls add child
    // TODO: build a better fucntion for this...
    this.childAdd({
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

    this.childAdd({
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

    this.columnAdd({
      columnName: "emailConversationId",
      friendlyName: "Email Conversation Id",
      columnType: "string",
      index: true,
      hidden: true,
      helpText: "Used to map incoming emails to tickets.",
    });

    this.columnAdd({
      columnName: "emailId",
      friendlyName: "Email ID",
      columnType: "string",
      index: true,
      hidden: true,
      helpText: "ID of last email receieved. Used to send replies.",
    });

    this.columnAdd({
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

    this.actionAdd({
      label: "Assign to Me",
      method: "assignToMe",
      verify: "Assign this ticket to yourself?",
      helpText: "Assign this ticket to yourself.",
    });

    this.actionAdd({
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

    this.actionAdd({
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

    this.actionAdd({
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

    this.actionAdd({
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

    this.actionAdd({
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

    // Special role for who can be assigned a ticket
    this.addRecord({
      packageName: "core",
      className: "role",
      name: "Resolver",
      desc: "Can be assigned tickets. Must not be assigned to groups. Always assign directly to users.",
    });

    this.initAdd(async () => {
      this.packages.core.event.on("email", async (email) => {
        await this.createFromEmail(email);
      });

      this.packages.core.event.on(
        "core.comment.recordCreate.after",
        async ({ data, req }) => {
          console.log("recordCreate.after", data);
          await this.emailComment(data, req);
        }
      );

      this.packages.core.event.on(
        "ticketing.ticket.recordCreate.after",
        async (...args) => {
          await this.emailNewTicket(...args);
        }
      );

      // Register a fancy query modifier for the user table
      this.packages.core.user.queryModifierAdd(
        "ticketing.ticket.resolver",
        (query, knex) => {
          return query.whereIn(
            "id",
            knex
              .select("id2")
              .from("user_role")
              .where(
                "id1",
                knex.select("id").from("role").where("name", "Resolver")
              )
          );
        }
      );

      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      this.templates = {};

      this.templates.subject = await this.compileTemplate(
        path.join(__dirname, "ticket", "subject.hbs")
      );
      this.templates.newCommentBody = await this.compileTemplate(
        path.join(__dirname, "ticket", "newCommentBody.hbs")
      );
      this.templates.newTicketBody = await this.compileTemplate(
        path.join(__dirname, "ticket", "newTicketBody.hbs")
      );
    });
  }

  async sendEmail({
    recordId,
    userId,
    emailBody,
    emailSubject,
    provider = this.config.email.defaultMailbox,
    emailId,
    emailConversationId,
    req,
  }) {
    const user = await this.packages.core.user.recordGet({
      recordId: userId,
    });

    if (!user) {
      //req.warnings.push("No user found! Can not send email");
      //return;
      throw new Error("No user found! Can not send email");
    }

    if (!user.email || !user.email.match(/@/)) {
      //req.warnings.push("No valid email found for user! Can not send email");
      //return;
      throw new Error("No valid email found for user! Can not send email");
    }

    const email = {
      body: emailBody,
      subject: emailSubject,
      to: user.email,
      emailId: emailId,
      emailConversationId: emailConversationId,
    };

    const results = await this.packages.core.email.sendEmail({
      email,
      provider: provider,
    });

    if (results && results.emailId && results.emailConversationId) {
      await this.recordUpdate({
        recordId,
        data: {
          emailId: results.emailId,
          emailConversationId: results.emailConversationId,
        },
        req,
      });
    }

    return results;
  }

  async emailNewTicket({ recordId, data, req }) {
    //// Only email things if it was created by a real user
    //if (req.user.id >= 1) {

    try {
      await this.sendEmail({
        recordId,
        userId: data.requester,
        emailBody: this.templates.newTicketBody({
          record: data,
          body: data.body,
        }),
        emailSubject: this.templates.subject({
          record: data,
          body: data.body,
        }),
        provider: data.emailProvider,
        req,
      });
    } catch (error) {
      req.message({
        detail: `Error sending email: ${error.message}`,
        severity: "warn",
      });
    }
    //}
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

    args.record = await this.packages[args.db][args.table].recordGet({
      where: { id: args.row },
    });

    try {
      await this.sendEmail({
        recordId: args.row,
        userId: args.record.requester,
        emailBody: this.templates.newCommentBody(args),
        emailSubject: this.templates.subject(args),
        provider: args.record.emailProvider,
        req,
      });
    } catch (error) {
      req.message({
        detail: `Error sending email: ${error.message}`,
        severity: "warn",
      });
    }

    return;
  }

  async timeEntry({ recordId, Minutes, req }) {
    await this.packages.core.time.createEntry({
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
    await this.packages.core.comment.createComment({
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
    await this.packages.core.comment.createComment({
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

    await this.packages.core.comment.createComment({
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
        this.packages.core.comment.createComment({
          req: {
            user: {
              id: 1,
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
              id: "1",
            },
            action: "Ticket Note from Email",
          },
        });

        return;
      }
    }

    const user = await this.packages.core.user.getUserOrCreate(message.from);

    // TODO build an config option to create user if not found, create ticket with no requester, or reject email

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
          id: "1",
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
