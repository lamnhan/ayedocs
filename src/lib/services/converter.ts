import { Project } from './project';
import { Block, Content } from './content';

import { Declaration } from '../declaration';

export interface ConvertOptions {
  level?: number;
  id?: string;
  heading?: string;
}

export class Converter {
  private $Project: Project;
  private $Content: Content;

  constructor($Project: Project, $Content: Content) {
    this.$Project = $Project;
    this.$Content = $Content;
  }

  convert(
    declaration: Declaration,
    output: string,
    options: ConvertOptions = {}
  ) {
    const { level, id, heading } = options;
    // override level
    if (!!level) {
      declaration.setLevel(level);
    }
    // override id
    if (!!id) {
      declaration.setId(id);
    }
    // convert
    switch (output) {
      case 'SUMMARY_VARIABLES':
      case 'SUMMARY_PROPERTIES':
        return this.summaryVariablesOrProperties(
          declaration.getVariablesOrProperties()
        );
      case 'DETAIL_VARIABLES':
      case 'DETAIL_PROPERTIES':
        return this.detailVariablesOrProperties(
          declaration.getVariablesOrProperties()
        );
      case 'FULL_VARIABLES':
      case 'FULL_PROPERTIES':
        return this.fullVariablesOrProperties(declaration);
      case 'SUMMARY_FUNCTIONS':
      case 'SUMMARY_METHODS':
        return this.summaryFunctionsOrMethods(
          declaration.getFunctionsOrMethods()
        );
      case 'DETAIL_FUNCTIONS':
      case 'DETAIL_METHODS':
        return this.detailFunctionsOrMethods(
          declaration.getFunctionsOrMethods()
        );
      case 'FULL_FUNCTIONS':
      case 'FULL_METHODS':
        return this.fullFunctionsOrMethods(declaration);
      case 'SUMMARY_INTERFACES':
        return this.summaryInterfaces(declaration.getInterfaces());
      case 'DETAIL_INTERFACES':
        return this.detailInterfaces(declaration.getInterfaces());
      case 'SUMMARY_CLASSES':
        return this.summaryClasses(declaration.getClasses());
      case 'DETAIL_CLASSES':
        return this.detailClasses(declaration.getClasses());
      case 'FULL':
        return this.full(declaration, heading);
      case 'SELF':
      default:
        return this.self(declaration, heading);
    }
  }

  private self(declaration: Declaration, heading?: string) {
    const blocks: Block[] = [];
    const kindText = (declaration.REFLECTION.kindString || 'Unknown').toLowerCase();
    const {
      LEVEL,
      ID,
      NAME,
      LINK,
      TYPE,
      TYPE_LINK,
      SHORT_TEXT,
      TEXT,
      RETURNS,
      PARAMETERS,
    } = declaration;
    // default blocks
    const body = this.$Content.buildText([
      SHORT_TEXT || `The \`${NAME}\` ${kindText}.`,
      TEXT || '',
    ]);
    // function or method
    if (declaration.isKind('CallSignature')) {
      const params = PARAMETERS
        .map(({ name, isOptional }) => isOptional ? name + '?' : name)
        .join(', ');
      const title = heading || `\`${NAME}(${params})\``;
      blocks.push(
        this.$Content.buildHeader(ID, LEVEL, title, LINK),
        body
      );
      // params
      if (!!PARAMETERS.length) {
        const parameterRows = PARAMETERS.map(parameter => {
          const { name, isOptional, type, typeLink, text } = parameter;
          return [
            !isOptional ? `**${name}**` : name,
            !!typeLink ? `[\`${type}\`](${typeLink})` : `\`${type}\``,
            text || '',
          ];
        });
        blocks.push(
          this.$Content.buildText(`**Parameters**`),
          this.$Content.buildTable(
            ['Param', 'Type', 'Description'],
            parameterRows
          )
        );
      }
      // returns
      const displayType = !!TYPE_LINK
        ? `[\`${TYPE}\`](${TYPE_LINK})`
        : `\`${TYPE}\``;
      blocks.push(
        this.$Content.buildText([
          `**Returns**`,
          `${displayType}${!RETURNS ? '' : ' - ' + RETURNS}`,
        ])
      );
    }
    // variable or property
    else if (declaration.isKind('Variable') || declaration.isKind('Property')) {
      const title = heading || `\`${NAME}\``;
      blocks.push(
        this.$Content.buildHeader(ID, LEVEL, title, LINK),
        body
      );
    }
    // any
    else {
      const title = heading || `The \`${NAME}\` ${kindText}`;
      blocks.push(
        this.$Content.buildHeader(ID, LEVEL, title, LINK),
        body
      );
    }
    // result
    return blocks;
  }

  private full(declaration: Declaration, heading?: string) {
    // self
    const self = this.self(declaration, heading);
    // variables or properties
    const variablesOrPropertiesFull = declaration.hasVariablesOrProperties()
      ? this.fullVariablesOrProperties(declaration)
      : [];
    // functions or methods
    const functionsOrMethodsFull = declaration.hasFunctionsOrMethods()
      ? this.fullFunctionsOrMethods(declaration)
      : [];
    // interfaces
    const interfacesFull = declaration.hasInterfaces()
      ? this.detailInterfaces(declaration.getInterfaces())
      : [];
    // classes
    const classesFull = declaration.hasClasses()
      ? this.detailClasses(declaration.getClasses())
      : [];
    // all blocks
    return [
      ...self,
      ...variablesOrPropertiesFull,
      ...functionsOrMethodsFull,
      ...interfacesFull,
      ...classesFull,
    ];
  }

  private summaryVariablesOrProperties(
    declarations: Declaration[],
    standalone = true
  ) {
    const blocks: Block[] = [];
    // get data
    const summaryRows: string[][] = [];
    declarations.forEach(declaration => {
      const {
        ID,
        NAME,
        LINK,
        IS_OPTIONAL,
        TYPE,
        TYPE_LINK,
        SHORT_TEXT,
      } = declaration;
      const displayName = !IS_OPTIONAL ? `**${NAME}**` : NAME;
      const ref = standalone ? LINK : '#' + ID;
      summaryRows.push([
        `[${displayName}](${ref})`,
        !!TYPE_LINK ? `[\`${TYPE}\`](${TYPE_LINK})` : `\`${TYPE}\``,
        SHORT_TEXT || '',
      ]);
    });
    // summary blocks
    if (!!summaryRows.length) {
      const summaryBlock = this.$Content.buildTable(
        ['Name', 'Type', 'Description'],
        summaryRows
      );
      blocks.push(summaryBlock);
    }
    // result
    return blocks;
  }

  private detailVariablesOrProperties(declarations: Declaration[]) {
    const blocks: Block[] = [];
    declarations.forEach(declaration =>
      blocks.push(
        ...this.self(declaration),
        this.$Content.buildText('---')
      )
    );
    return blocks;
  }

  private fullVariablesOrProperties(declaration: Declaration) {
    const parentName = declaration.NAME;
    const childKind = declaration.isKind('Global') ? 'variables' : 'properties';
    // children
    const children = declaration.getVariablesOrProperties();
    if (!children.length) {
      return [];
    }
    // summary
    const summaryText = this.$Content.buildText(`**${parentName} ${childKind}**`);
    const summaryBlocks = this.summaryVariablesOrProperties(
      children,
      false
    );
    // detail
    const detailText = this.$Content.buildText(
      `**${parentName} detail ${childKind}**`
    );
    const detailBlocks = this.detailVariablesOrProperties(children);
    // result
    return [summaryText, ...summaryBlocks, detailText, ...detailBlocks];
  }

  private summaryFunctionsOrMethods(
    declarations: Declaration[],
    standalone = true
  ) {
    const blocks: Block[] = [];
    // get data
    const summaryRows: string[][] = [];
    declarations.forEach(declaration => {
      const {
        ID,
        NAME,
        LINK,
        TYPE,
        TYPE_LINK,
        SHORT_TEXT,
        PARAMETERS,
      } = declaration;
      const params = PARAMETERS
        .map(({ name, isOptional }) => isOptional ? name + '?' : name)
        .join(', ');
      const displayName = `${NAME}(${params})`;
      const ref = standalone ? LINK : '#' + ID;
      summaryRows.push([
        `[${displayName}](${ref})`,
        !!TYPE_LINK ? `[\`${TYPE}\`](${TYPE_LINK})` : `\`${TYPE}\``,
        SHORT_TEXT || '',
      ]);
    });
    // summary blocks
    if (!!summaryRows.length) {
      const summaryBlock = this.$Content.buildTable(
        ['Function', 'Returns type', 'Description'],
        summaryRows
      );
      blocks.push(summaryBlock);
    }
    // result
    return blocks;
  }

  private detailFunctionsOrMethods(declarations: Declaration[]) {
    const blocks: Block[] = [];
    declarations.forEach(declaration =>
      blocks.push(
        ...this.self(declaration),
        this.$Content.buildText('---')
      )
    );
    return blocks;
  }

  private fullFunctionsOrMethods(declaration: Declaration) {
    const parentName = declaration.NAME;
    const childKind = declaration.isKind('Global') ? 'functions' : 'methods';
    // children
    const children = declaration.getFunctionsOrMethods();
    if (!children.length) {
      return [];
    }
    // summary
    const summaryText = this.$Content.buildText(`**${parentName} ${childKind}**`);
    const summaryBlocks = this.summaryFunctionsOrMethods(
      children,
      false
    );
    // detail
    const detailText = this.$Content.buildText(
      `**${parentName} detail ${childKind}**`
    );
    const detailBlocks = this.detailFunctionsOrMethods(children);
    // result
    return [summaryText, ...summaryBlocks, detailText, ...detailBlocks];
  }

  private summaryInterfaces(
    interfaces: Declaration[],
    standalone = true
  ) {
    const blocks: Block[] = [];
    // get data
    const summaryRows: string[][] = [];
    interfaces.forEach(_interface => {
      const { ID, NAME, LINK, SHORT_TEXT } = _interface;
      const ref = standalone ? LINK : '#' + ID;
      summaryRows.push([`[${NAME}](${ref})`, SHORT_TEXT || '']);
    });
    // summary block
    if (!!summaryRows.length) {
      const summaryBlock = this.$Content.buildTable(
        ['Interfaces', 'Description'],
        summaryRows
      );
      blocks.push(summaryBlock);
    }
    // result
    return blocks;
  }

  private detailInterfaces(declarations: Declaration[]) {
    const blocks: Block[] = [];
    declarations.forEach(_interface => blocks.push(...this.full(_interface)));
    return blocks;
  }

  private summaryClasses(classes: Declaration[], standalone = true) {
    const blocks: Block[] = [];
    // get data
    const summaryRows: string[][] = [];
    classes.forEach(_class => {
      const { ID, NAME, LINK, SHORT_TEXT } = _class;
      const ref = standalone ? LINK : '#' + ID;
      summaryRows.push([`[${NAME}](${ref})`, SHORT_TEXT || '']);
    });
    // summary block
    if (!!summaryRows.length) {
      const summaryBlock = this.$Content.buildTable(
        ['Classes', 'Description'],
        summaryRows
      );
      blocks.push(summaryBlock);
    }
    // result
    return blocks;
  }

  private detailClasses(declarations: Declaration[]) {
    const blocks: Block[] = [];
    declarations.forEach(_class => blocks.push(...this.full(_class)));
    return blocks;
  }

}
