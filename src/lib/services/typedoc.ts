// tslint:disable: no-any
import {
  Application,
  ReflectionKind,
  Reflection,
  ContainerReflection,
  ProjectReflection,
  DeclarationReflection,
} from 'typedoc';
import { ReferenceType, ArrayType, UnionType } from 'typedoc/dist/lib/models';

import { Project } from './project';

export * from 'typedoc';
export * from 'typedoc/dist/lib/models';

export type KindString = keyof typeof ReflectionKind;

export type DefaultValue = any;

export interface TypedocOptions {
  [key: string]: any;
}

interface TypeData {
  type: string;
  displayType: string;
}

interface FlagData {
  isOptional?: boolean;
}

interface DefaultValueData {
  defaultValue?: DefaultValue;
}

interface CommentData {
  shortText?: string;
  text?: string;
  returns?: string;
}

export interface ReflectionData
  extends TypeData,
    FlagData,
    DefaultValueData,
    CommentData {
  name: string;
  link: string;
}

export type IterationHandler<Item, Data> = (
  event: IterationEvent<Item, Data>
) => void;

export type IterationFormatter<Data> = (data: Data) => Data;

interface IterationEvent<Item, Data> {
  item: Item;
  data: Data;
  displayData: Data;
}

export class Typedoc {
  private $Project: Project;

  typedocApp: Application;
  typedocProject: ProjectReflection;

  constructor(
    $Project: Project,
    typedocApp?: Application,
    typedocProject?: ProjectReflection
  ) {
    this.$Project = $Project;
    // init the default instance
    this.typedocApp = typedocApp || this.createApp();
    this.typedocProject =
      typedocProject || this.createProject(this.typedocApp, ['src']);
  }

  generateDocs(out: string) {
    return this.typedocApp.generateDocs(this.typedocProject, out);
  }

  getKindByString(kindString: keyof typeof ReflectionKind) {
    return ReflectionKind[kindString];
  }

  isReflectionKind(
    reflection: Reflection,
    kindString: keyof typeof ReflectionKind
  ) {
    return reflection.kind === this.getKindByString(kindString);
  }

  getReflections(
    kindString: keyof typeof ReflectionKind,
    container?: Reflection
  ) {
    const kind = this.getKindByString(kindString);
    const parent = (container as ContainerReflection) || this.typedocProject;
    return !!kind ? parent.getChildrenByKind(kind) : parent.children || [];
  }

  getReflection(what?: string | string[]) {
    const reflection = !what
      ? // default project
        this.typedocProject
      : typeof what === 'string'
      ? // class or interface
        this.typedocProject.getChildByName(what)
      : // custom project
        // TODO: do not create new project
        this.createProject(
          this.createApp({
            name: what.join(' ').replace(/(src\/)/g, '@'),
            excludeExternal: true,
          }),
          what
        );
    if (!reflection) {
      throw new Error('No reflection found.');
    }
    return reflection;
  }

  getChildReflection(container: Reflection, name: string) {
    const reflection = container.getChildByName(name);
    if (!reflection) {
      throw new Error('No child.');
    }
    return reflection;
  }

  extractReflection(reflection: Reflection) {
    const { name } = reflection;
    const link = this.getLink(reflection);
    const typeData = this.getType(reflection);
    const flagData = this.getFlags(reflection);
    const defaultValueData = this.getDefaultValue(reflection);
    const commentData = this.getComment(reflection);
    // result
    return {
      name,
      link,
      ...typeData,
      ...flagData,
      ...defaultValueData,
      ...commentData,
    } as ReflectionData;
  }

  private createApp(configs = {}) {
    const { name: packageName } = this.$Project.PACKAGE;
    const { typedoc: localConfigs } = this.$Project.OPTIONS;
    // default configs
    const typedocOptions = {
      name: `${packageName} API Reference`,
      mode: 'file',
      logger: 'none',
      target: 'ES5',
      module: 'CommonJS',
      experimentalDecorators: true,
      ignoreCompilerErrors: true,
      excludeNotExported: true,
      excludePrivate: true,
      excludeProtected: true,
      ...localConfigs,
    };
    // create app
    return new Application({ ...typedocOptions, ...configs });
  }

  private createProject(app: Application, src: string[]) {
    //  init project
    const projectReflection = app.convert(app.expandInputFiles(src));
    if (!projectReflection) {
      throw new Error('Typedoc convert failed.');
    }
    return projectReflection;
  }

  private getTypeLink(name: string, kind: ReflectionKind) {
    const { typedoc: { readme } } = this.$Project.OPTIONS;
    const home = !!readme && readme === 'none' ? 'index' : 'globals';
    const id = name.toLowerCase();
    // build link
    let link = '';
    if (kind === ReflectionKind.Interface) {
      link = `interfaces/${id}.html`;
    } else if (kind === ReflectionKind.Class) {
      link = `classes/${id}.html`;
    } else if (
      kind === ReflectionKind.Variable ||
      kind === ReflectionKind.Function ||
      kind === ReflectionKind.TypeAlias
    ) {
      link = `${home}.html#${id}`;
    } else {
      link = `${home}.html`;
    }
    // result
    const { url: apiUrl } = this.$Project.OPTIONS;
    return apiUrl + '/' + link;
  }

  private getLink(reflection: Reflection) {
    const { name, kind, parent } = reflection;
    const fragment = name.toLowerCase();
    // interface/class props
    if (
      !!parent &&
      (parent.kind === ReflectionKind.Interface ||
        parent.kind === ReflectionKind.Class)
    ) {
      return this.getTypeLink(parent.name, parent.kind) + '#' + fragment;
    }
    // class methods
    else if (
      !!parent && // the method
      !!parent.parent && // the class
      parent.kind === ReflectionKind.Method &&
      parent.name === name
    ) {
      return (
        this.getTypeLink(parent.parent.name, parent.parent.kind) +
        '#' +
        fragment
      );
    }
    // interface | class | globals
    else {
      return this.getTypeLink(name, kind);
    }
  }

  private getType(reflection: Reflection) {
    const { type } = reflection as DeclarationReflection;
    // get type data
    const typeData = { type: 'none', displayType: 'none' } as TypeData;
    if (!!type) {
      // default type
      const typeString = type.toString();
      typeData.type = typeString;
      typeData.displayType = typeString;
      // ref
      if (type.type === 'reference' && !!(type as ReferenceType).reflection) {
        const { reflection: typeReflection } = type as ReferenceType;
        const { name, kind } = typeReflection as Reflection;
        const link = this.getTypeLink(name, kind);
        typeData.displayType = `<a href="${link}" target="_blank">${name}</a>`;
      }
      // array
      else if (type.type === 'array') {
        const { elementType } = type as ArrayType;
        const { displayType } = this.getType({ type: elementType } as any);
        typeData.displayType = displayType + '[]';
      }
      // union
      else if (type.type === 'union') {
        const { types } = type as UnionType;
        const displayTypes = types.map(itemType => {
          const { displayType } = this.getType({ type: itemType } as any);
          return displayType;
        });
        typeData.displayType = displayTypes.join(' | ');
      }
    }
    // result
    return typeData;
  }

  private getFlags(reflection: Reflection) {
    const { flags, defaultValue } = reflection as DeclarationReflection;
    // get flag data
    const flagData: FlagData = { isOptional: false };
    if (!!flags) {
      flagData.isOptional = flags.isOptional || !!defaultValue;
    }
    // result
    return flagData;
  }

  private getDefaultValue(reflection: Reflection) {
    const {
      kind,
      defaultValue = '',
      children = [],
    } = reflection as DeclarationReflection;
    // get default value data
    const defaultValueData: DefaultValueData = { defaultValue: '' };
    if (
      kind === ReflectionKind.Variable ||
      kind === ReflectionKind.Property ||
      kind === ReflectionKind.ObjectLiteral
    ) {
      // object literal
      if (!!children.length) {
        const value: { [name: string]: any } = {};
        children.forEach(childReflection => {
          const { defaultValue } = this.getDefaultValue(childReflection);
          value[childReflection.name] = defaultValue;
        });
        defaultValueData.defaultValue = value;
      }
      // any
      else {
        defaultValueData.defaultValue = this.parseDefaultValue(defaultValue);
      }
    }
    // result
    return defaultValueData;
  }

  private parseDefaultValue(value: any) {
    value = value.trim();
    // string
    if (value.slice(0, 1) === '"' && value.slice(-1) === '"') {
      value = (value as string).slice(1, -1);
    }
    // true
    else if ((value + '').toLowerCase() === 'true') {
      value = true;
    }
    // false
    else if ((value + '').toLowerCase() === 'false') {
      value = false;
    }
    // number
    else if (!isNaN(value)) {
      value = Number(value);
    }
    // array, ...
    else {
      try {
        const valueJson = value
          .replace(/\ .:/g, '"$&":') // wrap '"' around object props
          .replace(/(" )|(:")/g, '"') // cleanup object props wrapping
          .replace(/\'/g, '"'); // replace string single quote with double quote
        value = JSON.parse(valueJson);
      } catch (e) {
        /* invalid json, keep value as is */
      }
    }
    // result
    return value as DefaultValue;
  }

  private getComment(reflection: Reflection) {
    const { comment } = reflection as DeclarationReflection;
    // get comment data
    const commentData: CommentData = {};
    if (!!comment) {
      const { shortText = '', text = '', returns = '' } = comment;
      commentData.shortText = shortText.replace(/(?:\r\n|\r|\n)/g, '  ');
      commentData.text = text;
      commentData.returns = returns;
    }
    // result
    return commentData;
  }
}
