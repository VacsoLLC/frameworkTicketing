//import Table from "../../table.js";
import {
  Table,
  systemUser,
  elevateUser,
  systemRequest,
} from '@vacso/frameworkbackend';

import * as validators from './ticket_schema.js';

import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
import Handlebars from 'handlebars';

export default class Ticket extends Table {
  constructor(args) {
    super({name: 'Ticket', className: 'ticket', ...args});

    this.rolesWriteAdd('Resolver', 'Admin');
    this.rolesReadAdd('Authenticated');
    this.rolesDeleteAdd('Admin');

    this.columnAdd({
      columnName: 'created',
      friendlyName: 'Created',
      columnType: 'datetime',
      hiddenCreate: true,
      readOnly: true,
      onCreate: () => {
        return Date.now();
      },
    });

    this.manyToOneAdd({
      columnName: 'requester',
      helpText: 'User who requested the ticket',
      rolesWrite: ['Resolver', 'Admin'],
      rolesRead: ['Authenticated'],
      referencedTableName: 'user',
      referencedDb: 'core',
      referenceCreate: true,
      displayColumns: [
        {
          columnName: 'name',
          friendlyName: 'Requester',
        },
      ],

      tabName: 'Tickets Opened',
      defaultValue: async ({req}) => {
        return req.user.id;
      },
      index: true,
    });

    this.columnAdd({
      columnName: 'subject',
      friendlyName: 'Subject',
      columnType: 'string',
      index: true,
      required: true,
      helpText: 'Subject or Title of the ticket',
      rolesCreate: ['Authenticated'],
      validations: [
        ({value}) => {
          if (value?.length < 1) {
            return 'Subject must be at least 1 characters long.';
          }
        },
      ],
    });

    this.columnAdd({
      columnName: 'body',
      friendlyName: 'Body',
      columnType: 'text',
      index: true,
      helpText: 'Body of the ticket',
      rolesCreate: ['Authenticated'],
    });

    this.manyToOneAdd({
      columnName: 'group',
      helpText: 'Group the ticket is assigned to',
      rolesWrite: ['Resolver', 'Admin'],
      rolesRead: ['Resolver', 'Admin', 'Authenticated'],
      referencedTableName: 'group',
      referencedDb: 'core',
      displayColumns: [
        {
          columnName: 'name',
          friendlyName: 'Group',
        },
      ],
      tabName: 'Tickets Assigned',
      index: true,
    });

    // Example usage with custom column name and displayColumns (though displayColumns isn't directly utilized in schema creation)
    this.manyToOneAdd({
      columnName: 'assignedTo',
      helpText: 'User the ticket is assigned to',
      rolesWrite: ['Resolver', 'Admin'],
      rolesRead: ['Resolver', 'Admin', 'Authenticated'],
      referencedTableName: 'user',
      referencedDb: 'core',
      queryModifier: 'ticketing.ticket.resolver',
      displayColumns: [
        {
          columnName: 'name',
          friendlyName: 'Assigned To',
        },
      ],

      tabName: 'Tickets Assigned',
      defaultValue: async ({req}) => {
        if (await req.user.userHasAnyRoleName('Resolver')) {
          return req.user.id;
        } else {
          return '';
        }
      },
      index: true,
    });

    this.columnAdd({
      columnName: 'status',
      friendlyName: 'Status',
      rolesWrite: ['Resolver', 'Admin'],
      rolesRead: ['Resolver', 'Admin', 'Authenticated'],
      //columnType: 'string',
      index: true,
      helpText: 'Status of the ticket',
      defaultValue: 'Open',
      fieldType: 'select',
      options: ['Open', 'Closed', 'Pending Feedback', 'Feedback Received'],
    });

    // TODO: document this use case... comment is a generic table that can be reused... manyToOneAdd should be used when ever possible, and it automatically calls add child
    // TODO: build a better fucntion for this...
    this.childAdd({
      db: 'core', // db name we want to make a child
      table: 'comment', // table name we want to make a child
      columnmap: {
        // key is the column name in the child table, value is from the parent table. Only db, table and id are availible options at this time from the parent
        db: 'db',
        table: 'table',
        row: 'id',
      },
      tabName: 'Comments',
    });

    this.childAdd({
      db: 'core', // db name we want to make a child
      table: 'time', // table name we want to make a child
      columnmap: {
        // key is the column name in the child table, value is from the parent table. Only db, table and id are availible options at this time from the parent
        db: 'db',
        table: 'table',
        row: 'id',
      },
      tabName: 'Time',
    });

    this.childAdd({
      db: 'core', // db name we want to make a child
      table: 'attachment', // table name we want to make a child
      columnmap: {
        // key is the column name in the child table, value is from the parent table. Only db, table and id are availible options at this time from the parent
        db: 'db',
        table: 'table',
        row: 'id',
      },
      tabName: 'Attachments',
      tabOrder: 99997,
    });

    this.columnAdd({
      columnName: 'emailConversationId',
      friendlyName: 'Email Conversation Id',
      columnType: 'string',
      index: true,
      hidden: true,
      helpText: 'Used to map incoming emails to tickets.',
    });

    this.columnAdd({
      columnName: 'emailId',
      friendlyName: 'Email ID',
      columnType: 'string',
      index: true,
      hidden: true,
      helpText: 'ID of last email receieved. Used to send replies.',
    });

    this.columnAdd({
      columnName: 'emailProvider',
      friendlyName: 'Email Provider',
      columnType: 'string',
      hidden: true,
      helpText: 'The email provider being used to communicate with the user.',
    });

    this.addMenuItem({
      label: 'Create Ticket',
      navigate: '/ticketing/ticket/create',
      icon: 'Plus',
      order: 1,
    });

    this.addMenuItem({
      label: 'Tickets',
      view: null,
      order: 2,
      icon: 'Ticket',
      roles: ['Resolver', 'Admin'],
    });

    this.addMenuItem({
      label: 'All Tickets',
      parent: 'Tickets',
      icon: 'List',
      order: 99,
      roles: ['Resolver', 'Admin'],
    });

    this.addMenuItem({
      label: 'My Tickets',
      parent: 'Tickets',
      filter: (req) => {
        return [
          {'ticket.assignedTo': req.user?.id},
          ['ticket.status', '!=', 'Closed'],
        ];
      },
      icon: 'User',
      order: 1,
      roles: ['Resolver', 'Admin'],
    });

    this.addMenuItem({
      label: 'My Tickets',
      rolesHide: ['Resolver', 'Admin'],
    });

    this.addMenuItem({
      label: "My Group's Tickets",
      parent: 'Tickets',
      filter: (req) => {
        return [['ticket.group', 'IN', req.user?.groups]];
      },
      icon: 'Users',
      order: 2,
      roles: ['Resolver', 'Admin'],
    });

    // Requesters can only see their own tickets
    this.addAccessFilter(async (user, query) => {
      if (user && !(await user.userHasAnyRoleName('Resolver', 'Admin'))) {
        query.where('requester', user.id);
      }
      return [query];
    });

    this.actionAdd({
      label: 'Assign to Me',
      method: this.assignToMe,
      verify: 'Assign this ticket to yourself?',
      helpText: 'Assign this ticket to yourself.',
      rolesExecute: ['Resolver', 'Admin'],
      disabled: this.ticketOpen,
      validator: validators.assignToMe,
    });

    this.actionAdd({
      label: 'Request Feedback',
      method: this.requestFeedback,
      helpText: 'Request feedback from the user.',
      rolesExecute: ['Resolver', 'Admin'],
      disabled: this.ticketOpen,
      verify:
        'Provide a commment to the user requesting additional information. The comment will be sent to the user and the ticket will be updated to "Feedback Requested" status.',
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
        Minutes: {
          fieldType: 'number',
          required: false,
        },
      },
      validator: validators.requestFeedback,
    });

    this.actionAdd({
      label: 'Public Update',
      method: this.publicUpdate,
      rolesExecute: ['Resolver', 'Admin'],
      verify: 'The comment will be sent to the user.',
      helpText: 'Add a public comment to the ticket.',
      disabled: this.ticketOpen,
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
        Minutes: {
          fieldType: 'number',
          required: false,
        },
      },
      validator: validators.publicUpdate,
    });

    this.actionAdd({
      label: 'Private Update',
      method: this.privateUpdate,
      rolesExecute: ['Resolver', 'Admin'],
      verify: 'The comment will not be sent to the user.',
      helpText: 'Add a private comment to the ticket.',
      disabled: this.ticketOpen,
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
        Minutes: {
          fieldType: 'number',
          required: false,
        },
      },
      validator: validators.privateUpdate,
    });

    this.actionAdd({
      label: 'Time Entry',
      method: this.timeEntry,
      rolesExecute: ['Resolver', 'Admin'],
      verify: 'Add a time entry to this ticket? Time is entered in minutes.',
      helpText: 'Add a time entry to this ticket.',
      disabled: this.ticketOpen,
      inputs: {
        Minutes: {
          fieldType: 'number',
          required: true,
          validations: [
            ({value}) => {
              if (isNaN(value) || value < 1) {
                return 'Minutes must be greater than 0.';
              }
            },
          ],
        },
      },
      validator: validators.timeEntry,
    });

    this.actionAdd({
      label: 'Close Ticket',
      id: 'CloseTicketResolver',
      method: this.closeTicket,
      helpText: 'Close this ticket.',
      verify:
        'Provide a commment to the user explaining why the ticket is being closed. The comment will be sent to the user and the ticket will be updated to closed status.',
      disabled: this.ticketOpen,
      rolesExecute: ['Resolver', 'Admin'],
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
        Minutes: {
          fieldType: 'number',
          required: false,
        },
      },
      validator: validators.closeTicket,
    });

    // These actions are just for requesters.
    this.actionAdd({
      label: 'Comment',
      method: this.requesterComment,
      helpText: 'Add a comment to the ticket.',
      rolesExecute: ['Authenticated'],
      rolesNotExecute: ['Resolver', 'Admin'], // Hide from resolvers. This is for end users only.
      disabled: this.ticketOpen,
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
      },
      validator: validators.requesterComment,
    });

    // These actions are just for requesters.
    this.actionAdd({
      label: 'Close Ticket',
      method: this.closeTicket,
      helpText: 'Close this ticket.',
      rolesExecute: ['Authenticated'],
      rolesNotExecute: ['Resolver', 'Admin'], // Hide from resolvers. This is for end users only.
      verify:
        'Are you sure you want to close this ticket? This action can not be undone. Please provide a comment on why you are closing the ticket.',
      disabled: this.ticketOpen,
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
      },
      validator: validators.closeTicket,
    });

    this.actionAdd({
      label: 'Reopen Ticket',
      method: this.openTicket,
      helpText: 'Reopen Ticket.',
      disabled: this.ticketClose,
      rolesExecute: ['Resolver', 'Admin'],
      verify:
        'Provide a commment to the user explaining why the ticket is being reopened. The comment will be sent to the user and the ticket will be updated to Open status.',
      inputs: {
        Comment: {
          fieldType: 'text',
          required: true,
        },
        Minutes: {
          fieldType: 'number',
          required: false,
        },
      },
      validator: validators.openTicket,
    });

    this.actionAdd({
      label: 'Attach File(s)',
      type: 'attach',
      disabled: this.ticketOpen,
      //TODO: add a validator for this action
    });

    // Special role for who can be assigned a ticket
    this.addRecord({
      packageName: 'core',
      className: 'role',
      name: 'Resolver',
      desc: 'Can be assigned tickets. Must not be assigned to groups. Always assign directly to users.',
    });

    this.addRecord({
      packageName: 'core',
      className: 'group',
      name: 'Helpdesk',
    });

    this.addRecord({
      packageName: 'core',
      className: 'user',
      name: 'Bob Resolver',
      password: process.env.ADMIN_PASSWORD || 'fdr*vjy!jrn4DKD4qxe',
      email: 'resolver@vacso.com',
      loginAllowed: true,
    });

    this.addRecord({
      packageName: 'core',
      className: 'user',
      name: 'Frank Requester',
      password: process.env.ADMIN_PASSWORD || 'fdr*vjy!jrn4DKD4qxe',
      email: 'requester@vacso.com',
      loginAllowed: true,
    });

    this.addRecord({
      packageName: 'core',
      className: 'user_group',
      id1: 1,
      id2: 3,
    });

    this.addRecord({
      packageName: 'core',
      className: 'user_role',
      id1: 3,
      id2: 3,
    });

    this.initAdd(async () => {
      this.packages.core.comment.rolesReadAdd('Authenticated');
      this.packages.core.comment.rolesWriteAdd('Resolver', 'Admin');
      this.packages.core.comment.addAccessFilter(async (user, query) => {
        // Plain users can't read private comments
        if (user && !(await user.userHasAnyRoleName('Resolver', 'Admin'))) {
          query.where('type', '!=', 'Private');
          const that = this;
          query.innerJoin('ticketing.ticket', function () {
            this.on('ticket.id', '=', 'comment.row');
            this.andOn('comment.db', '=', that.knex.raw("'ticketing'"));
            this.andOn('comment.table', '=', that.knex.raw("'ticket'"));
            this.andOn('requester', that.knex.raw(`'${user.id}'`));
          });
        }
        return [query];
      });

      this.packages.core.event.on('email', async (email) => {
        await this.createFromEmail(email);
      });

      this.packages.core.event.on('search.query', async (args) => {
        console.log(args);
        if (
          args.req.user &&
          !(await args.req.user.userHasAnyRoleName('Resolver', 'Admin'))
        ) {
          console.log('duh');
          args.filter = 'requester:' + args.req.user.id;
        }
        return [args.query, args.filter];
      });

      this.packages.core.user.actionAdd({
        label: 'Create Ticket for User',
        method: (...args) => {
          return this.createTicketForUser(...args); // force this to be bound to the ticket class. otherwise it will be bound to the user class.
        },
        rolesExecute: ['Admin', 'Authenticated'],
        inputs: {
          ticketTitle: {
            required: true,
            fieldType: 'string',
            friendlyName: 'Subject',
          },
          ticketDescription: {
            required: false,
            friendlyName: 'Body',
            fieldType: 'text',
          },
        },
        //TODO: add a validator for this
      });

      this.packages.core.event.on(
        'core.comment.recordCreate.after',
        async ({data, req}) => {
          console.log('recordCreate.after', data);
          await this.emailComment(data, req);
        },
      );

      this.packages.core.event.on(
        'ticketing.ticket.recordCreate.after',
        async (...args) => {
          await this.emailNewTicket(...args);
        },
      );

      // Register a fancy query modifier for the user table
      this.packages.core.user.queryModifierAdd(
        'ticketing.ticket.resolver',
        (query, knex, args) => {
          const newQuery = query.whereIn(
            'id',
            knex
              .select('id2')
              .from('user_role')
              .where(
                'id1',
                knex.select('id').from('role').where('name', 'Resolver'),
              ),
          );
          if (args.value) {
            // If the current value of the field is not included in the previous filter, we still want to include it in the list.
            newQuery.orWhere('id', args.value);
          }
          return newQuery;
        },
      );

      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      this.templates = {};

      this.templates.subject = await this.compileTemplate(
        path.join(__dirname, 'ticket', 'subject.hbs'),
      );
      this.templates.newCommentBody = await this.compileTemplate(
        path.join(__dirname, 'ticket', 'newCommentBody.hbs'),
      );
      this.templates.newTicketBody = await this.compileTemplate(
        path.join(__dirname, 'ticket', 'newTicketBody.hbs'),
      );

      // Is this a good implementation? Probably not.
      // This injects the requester of the ticket into the comment for search filtering purposes.
      // TODO how does this get updated IF the requester is changed on the ticket?
      this.packages.core.comment.objectToSearchObject = async (object) => {
        if (
          (object.db =
            'ticketing' && object.table == 'ticket' && object.type == 'Public')
        ) {
          const record = await this.packages.ticketing.ticket.recordGet({
            recordId: object.row,
            req: {},
          });
          console.log(record);
          return {
            ...object,
            requester: record.requester,
          };
        }
      };
    });
  }

  async objectToSearchText(object) {
    let text = `Subject: ${object.subject}\n${object.body}`;

    const records = await this.packages.core.comment.rowsGet({
      where: {
        row: object.id,
        table: this.table,
        db: this.db,
        type: 'Public',
      },
    });

    for (const record of records.rows) {
      text += `\n\nComment by: ${record.author_name}\n${record.body}`;
    }

    return text;
  }

  async ticketClose({record}) {
    if (record?.status !== 'Closed') {
      return 'Ticket must be closed.';
    }
  }

  async ticketOpen({record}) {
    if (record?.status === 'Closed') {
      return 'Ticket must not be closed.';
    }
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
      req,
    });

    if (!user) {
      //req.warnings.push("No user found! Can not send email");
      //return;
      throw new Error('No user found! Can not send email');
    }

    if (!user.email || !user.email.match(/@/)) {
      //req.warnings.push("No valid email found for user! Can not send email");
      //return;
      throw new Error('No valid email found for user! Can not send email');
    }

    if (process.env.DEMO_MODE == 'true') {
      throw new Error('Outbound emails are disabled in demo mode.');
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

  async emailNewTicket({recordId, data, req}) {
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
        req: elevateUser(req),
      });
    } catch (error) {
      req.message({
        detail: `Error sending email: ${error.message}`,
        severity: 'warn',
      });
    }
    //}
  }

  async emailComment(args, req) {
    console.log('comment', args);

    if (args && args.type === 'Private') {
      // We dont want to send emails for private comments
      return args;
    }

    if (args.author == '1') {
      // We dont want to send emails for system comments
      return args;
    }

    args.record = await this.packages[args.db][args.table].recordGet({
      where: {'ticket.id': args.row},
      req,
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
        severity: 'warn',
      });
    }

    return;
  }

  async timeEntry({recordId, Minutes, req}) {
    await this.packages.core.time.createEntry({
      req,
      db: this.db,
      table: this.table,
      recordId,
      seconds: Minutes * 60,
    });
    return {};
  }

  async assignToMe({recordId, req}) {
    await this.recordUpdate({
      recordId,
      data: {
        assignedTo: req.user.id,
      },
      req,
    });
    return {};
  }

  async requesterComment({recordId, Comment, req}) {
    await this.packages.core.comment.createComment({
      req: elevateUser(req), // execute as system user as the actual user doesn't have writes to write to the table.
      db: this.db,
      table: this.table,
      recordId,
      comment: Comment,
      type: 'Public',
    });

    await this.recordUpdate({
      recordId: recordId,
      data: {
        status: 'Feedback Received',
      },
      req: elevateUser(req),
    });

    return {};
  }

  async publicUpdate({recordId, Comment, Minutes, req}) {
    await this.packages.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment: Comment,
      type: 'Public',
    });

    if (Minutes) {
      await this.timeEntry({recordId, Minutes, req});
    }

    return {};
  }

  async privateUpdate({recordId, Comment, Minutes, req}) {
    await this.packages.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment: Comment,
      type: 'Private',
    });

    if (Minutes) {
      this.timeEntry({recordId, Minutes, req});
    }

    return {};
  }

  /**
   * Request feedback from the user for a ticket
   * @param params - The parameters for requesting feedback
   * @param params.recordId - The ID of the ticket
   * @param params.Comment - The comment to add to the ticket
   * @param params.Minutes - Optional time spent in minutes
   * @param params.req - The request object
   * @returns A promise that resolves to an empty object
   * @throws {Error} If the parameters are invalid
   */
  async requestFeedback({recordId, Comment, Minutes, req}) {
    await this.commentAndChangeStatus({
      recordId,
      comment: Comment,
      status: 'Pending Feedback',
      req,
    });

    if (Minutes) {
      this.timeEntry({recordId, Minutes, req});
    }

    return {};
  }

  async closeTicket({recordId, Comment, Minutes, req}) {
    await this.commentAndChangeStatus({
      recordId,
      comment: Comment,
      status: 'Closed',
      req: elevateUser(req),
    });

    if (Minutes && !isNaN(Minutes)) {
      await this.timeEntry({recordId, Minutes, req});
    }

    return {};
  }

  async openTicket({recordId, Comment, Minutes, req}) {
    await this.commentAndChangeStatus({
      recordId,
      comment: Comment,
      status: 'Open',
      req: elevateUser(req),
    });

    if (Minutes && !isNaN(Minutes)) {
      await this.timeEntry({recordId, Minutes, req});
    }

    return {};
  }

  async commentAndChangeStatus({
    recordId,
    comment,
    status,
    type = 'Public',
    req,
  }) {
    if (!comment) {
      throw new Error('Comment is required.');
    }

    await this.packages.core.comment.createComment({
      req,
      db: this.db,
      table: this.table,
      recordId,
      comment,
      type,
    });

    await this.recordUpdate({recordId, data: {status}, req});
  }

  async createFromEmail(message) {
    if (message.emailConversationId) {
      let record;

      try {
        record = await this.recordGet({
          where: {
            emailConversationId: message.emailConversationId,
          },
          req: systemUser(this),
        });
      } catch (e) {
        // noop
      }

      if (record) {
        console.log('Found existing ticket, adding comment.', record);
        this.packages.core.comment.createComment({
          req: systemRequest(this),
          /*{
            user: systemUser(this),
            action: "Ticket Note from Email",
            message: (...args) => {
              console.log("message: ", ...args);
            },
          },*/
          db: this.db,
          table: this.table,
          recordId: record.id,
          comment: message.body,
          type: 'Public',
        });

        await this.recordUpdate({
          recordId: record.id,
          data: {
            status: 'Feedback Received',
            emailId: message.emailId,
          },
          req: systemRequest(this),

          /*{
            user: systemUser(this),
            action: "Ticket Note from Email",
            message: (...args) => {
              console.log("message: ", ...args);
            },
          },*/
        });

        return;
      }
    }

    const user = await this.packages.core.user.getUserOrCreate(message.from);

    // TODO build an config option to create user if not found, create ticket with no requester, or reject email

    const newRecord = await this.recordCreate({
      data: {
        subject: message.subject,
        body: message.body,
        requester: user?.id,
        status: 'Open',
        group: message.assignmentGroup,
        emailConversationId: message.emailConversationId,
        emailId: message.emailId,
        emailProvider: message.emailProvider,
      },

      req: {
        user: systemUser(this),
        action: 'Ticket Create from Email',
      },
    });

    if (newRecord && message?.attachments?.length > 0) {
      await this.packages.core.attachment.addFilesToRecord({
        inputFiles: (message.attachments ?? []).map((item) => ({
          file: item.contentBytes,
          filename: item.name,
          type: 'file',
          mimetype: item.contentType,
        })),
        db: this.db,
        table: this.table,
        row: newRecord.id,
        req: systemRequest(this),
      });
    }
  }

  async createTicketForUser({recordId, ticketTitle, ticketDescription, req}) {
    const record = await this.recordCreate({
      data: {
        subject: ticketTitle,
        body: ticketDescription,
        requester: recordId,
        assignedTo: req.user.id,
      },
      req,
    });

    req.navigateTo(`/ticketing/ticket/${record.id}`);

    return {};
  }

  async compileTemplate(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, source) => {
        if (err) reject(err);
        else resolve(Handlebars.compile(source));
      });
    });
  }
}
