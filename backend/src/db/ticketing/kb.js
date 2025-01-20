import {Base} from '@vacso/frameworkBackend';
export default class KB extends Base {
  constructor(args) {
    super({
      name: 'KB',
      className: 'kb',
    });

    this.addMenuItem({
      label: 'Knowledge Base',
      icon: 'BookOpenText',
      navigate: '/core/page',
      view: 'pages',
    });
  }
}
