import {pathExistsSync} from 'fs-extra';

import {ProjectService} from './project.service';
import {
  ContentBySections,
  ContentBlock,
  ContentService,
  HeadingBlock,
} from './content.service';
import {LoadService} from './load.service';
import {ParseService} from './parse.service';
import {ConvertOptions, CustomConvert, ConvertService} from './convert.service';
import {
  BuiltinTemplate,
  CustomTemplate,
  TemplateOptions,
  TemplateService,
} from './template.service';
import {WebData, WebService} from './web.service';

import {
  RendererData,
  RendererFileData,
  RendererObject,
} from '../objects/renderer.object';

export interface AdvancedRendering {
  [section: string]: SectionRender;
}

export type DeclarationRender = [
  string,
  (string | CustomConvert)?,
  ConvertOptions?
];

export type BlockRender = ContentBlock | DeclarationRender;

export type SectionRender =
  | true // builtin
  | string // direct file
  | BuiltinTemplate // direct template
  | CustomTemplate // custom template
  | DeclarationRender // direct declaration
  | BlockRender[] // multiple blocks
  | SectionRenderWithOptions; // with options

export interface SectionRenderWithOptions
  extends RenderTemplateOptions,
    RenderFileOptions {
  template?: BuiltinTemplate | CustomTemplate;
  file?: string;
}

export type FileRender =
  | true // default file
  | string // direct file
  | BuiltinTemplate // direct template
  | CustomTemplate // custom template
  | AdvancedRendering // direct advanced rendering
  | FileRenderWithOptions; // with options

export interface FileRenderWithOptions
  extends RenderLocalOptions,
    RenderWebOptions,
    RenderTemplateOptions,
    RenderFileOptions {
  template?: BuiltinTemplate | CustomTemplate;
  file?: true | string;
  rendering?: AdvancedRendering;
}

/**
 * Local options override any corresponding global options
 */
export interface RenderLocalOptions {
  /**
   * Ignore global sections (current content will be replaced)
   */
  cleanOutput?: boolean;
}

/**
 * Web options provides more information for a web page
 */
export interface RenderWebOptions {
  /**
   * The page title
   */
  pageTitle?: string;
  /**
   * Show top level headings in the menu
   */
  deepMenu?: boolean;
  /**
   * Data used in the webpage
   */
  webData?: WebData;
}

/**
 * Additional option for file rendering
 */
export interface RenderFileOptions {
  /**
   * Offset all the headings
   */
  headingOffset?: number;
  /**
   * Extract all headings
   */
  autoTOC?: boolean;
}

/**
 * Additional option for template rendering
 */
export interface RenderTemplateOptions extends TemplateOptions {
  /**
   * Offset all the headings
   */
  headingOffset?: number;
}

export interface BatchRender {
  [path: string]: FileRender;
}

export interface RenderResult {
  src: string;
  value: string | ContentBlock[];
}

/**
 * Turns a render input into the final content
 */
export class RenderService {
  private tocPlaceholder = '[TOC]';

  constructor(
    private projectService: ProjectService,
    private contentService: ContentService,
    private loadService: LoadService,
    private parseService: ParseService,
    private convertService: ConvertService,
    private templateService: TemplateService,
    private webService: WebService
  ) {}

  render(
    batchRender: BatchRender,
    batchCurrentContent: {[path: string]: ContentBySections} = {},
    webOutput = false
  ) {
    const rendererData: RendererData = {};
    Object.keys(batchRender).forEach(path => {
      const renderInput = batchRender[path];
      const currentContent = batchCurrentContent[path] || {};
      rendererData[path] = this.getData(path, renderInput, currentContent);
    });
    return new RendererObject(
      this.projectService,
      this.contentService,
      this.parseService,
      this.webService,
      rendererData,
      webOutput
    );
  }

  getData(
    path: string,
    renderInput: FileRender,
    currentContent: ContentBySections = {}
  ) {
    const {cleanOutput: globalCleanOutput} = this.projectService.OPTIONS;
    // process input
    const {rendering, renderOptions} = this.processRenderInput(
      renderInput,
      path
    );
    // get data by rendering
    const renderingData = this.getRenderingData(rendering);
    // merge data
    const {cleanOutput: localCleanOutput} = renderOptions;
    const data: {
      [section: string]: string | RenderResult;
    } = {
      // auto toc for file
      ...(renderOptions.autoTOC ? {toc: {src: 'true', value: []}} : {}),
      // current content from file
      ...(!!localCleanOutput || // local = true
      (!!globalCleanOutput && // global = true
        localCleanOutput === undefined) // local not provided
        ? {}
        : this.loadService.load(path)),
      // current content by arg
      ...currentContent,
      // rendering content
      ...renderingData,
    };
    // extract toc & content data
    const headings: ContentBlock[] = [];
    const contentStack: string[] = [];
    Object.keys(data).forEach(sectionName => {
      const sectionData = data[sectionName];
      // process section data
      let sectionContent: string;
      const sectionAttrs: {[attr: string]: string} = {};
      let sectionHeadings: string | HeadingBlock[] = [];
      // current content
      if (typeof sectionData === 'string') {
        sectionContent = sectionHeadings = sectionData;
      }
      // auto content
      else {
        const {value} = sectionData;
        // attrs
        sectionAttrs['data-note'] =
          'AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!';
        // content
        if (typeof value === 'string') {
          sectionContent = sectionHeadings = value;
        } else {
          sectionContent =
            sectionName === 'toc' || sectionName === 'tocx'
              ? this.tocPlaceholder
              : this.contentService.renderContent(value);
          sectionHeadings = value.filter(
            block => block.type === 'heading'
          ) as HeadingBlock[];
        }
      }
      // save content to the stack
      contentStack.push(
        this.contentService.sectionOpening(sectionName, sectionAttrs),
        sectionContent,
        this.contentService.sectionClosing()
      );
      // save headings for toc
      headings.push(
        ...(typeof sectionHeadings === 'string'
          ? this.contentService.extractHeadings(sectionHeadings)
          : sectionHeadings)
      );
    });
    // render the content stack
    let content = this.contentService.renderText(contentStack);
    // add the toc
    if (!!data.toc || !!data.tocx) {
      const tocContent = this.contentService.renderContent(
        data.tocx ? this.getDataTOCX(headings) : this.getDataTOC(headings)
      );
      content = content.replace(this.tocPlaceholder, tocContent);
    }
    // result
    return {
      headings,
      content:
        path.substr(-5) === '.html'
          ? this.contentService.md2Html(content)
          : content,
      options: renderOptions,
    } as RendererFileData;
  }

  getRenderingData(rendering: AdvancedRendering) {
    const result: {[section: string]: RenderResult} = {};
    // get data for every section
    Object.keys(rendering).forEach(sectionName => {
      let sectionResult: RenderResult;
      // process section rendering
      let renderValue: undefined | SectionRender = rendering[sectionName];
      let renderOptions: RenderFileOptions | RenderTemplateOptions = {};
      // with options
      if (
        renderValue instanceof Object &&
        !(renderValue instanceof Function) &&
        !(renderValue instanceof Array)
      ) {
        renderOptions = {...renderValue};
        renderValue = renderValue.template || renderValue.file;
      }
      // invalid
      if (!renderValue) {
        throw new Error('Invalid render value.');
      }
      // build-in
      else if (renderValue === true) {
        let sectionBlocks: ContentBlock[] = [];
        // head
        if (sectionName === 'head') {
          sectionBlocks = this.getDataHead();
        }
        // license
        else if (sectionName === 'license') {
          sectionBlocks = this.getDataLicense();
        }
        // toc, tocx ...
        else {
          sectionBlocks = [];
        }
        // builtin section result
        sectionResult = {src: 'true', value: sectionBlocks};
      }
      // file
      else if (
        typeof renderValue === 'string' &&
        renderValue.indexOf('.') !== -1 // a file
      ) {
        const filePath = renderValue.replace('@', 'src/');
        let content = 'TODO';
        if (pathExistsSync(filePath)) {
          content = this.contentService.readFileSync(filePath);
          // render inline
          content = this.renderInline(content);
          // modifications
          const {headingOffset} = renderOptions;
          if (headingOffset) {
            content = this.contentService.modifyHeadings(
              content,
              headingOffset
            );
          }
        }
        sectionResult = {
          src: renderValue,
          value: content,
        };
      }
      // template
      else if (
        typeof renderValue === 'string' ||
        renderValue instanceof Function
      ) {
        const advancedRendering = this.templateService.getTemplate(
          renderValue as BuiltinTemplate | CustomTemplate
        );
        const contentBySections = this.getRenderingData(advancedRendering);
        let content = Object.keys(contentBySections)
          .map(section => contentBySections[section].value)
          .join(this.contentService.EOL2X);
        // modifications
        const {headingOffset} = renderOptions;
        if (headingOffset) {
          content = this.contentService.modifyHeadings(content, headingOffset);
        }
        sectionResult = {
          src:
            typeof renderValue === 'string' ? renderValue : 'custom_template',
          value: content,
        };
      }
      // declarations
      else {
        const declarationBlocks: ContentBlock[] = [];
        // turn single block rendering to multiple
        const blockRenderings =
          renderValue instanceof Array && renderValue[0] instanceof Object // array or object
            ? // blocks or multi declarations
              (renderValue as BlockRender[])
            : // a block or single declaration
              [renderValue as DeclarationRender];
        // get section blocks
        blockRenderings.forEach(blockRendering => {
          // declaration
          if (blockRendering instanceof Array) {
            const [input, output = 'SELF', options = {}] = blockRendering;
            // parsing & converting
            const declaration = this.parseService.parse(input);
            const blocks = this.convertService.convert(
              declaration,
              output,
              options
            );
            // add all blocks as section blocks
            declarationBlocks.push(...blocks);
          }
          // block
          else {
            declarationBlocks.push(blockRendering);
          }
        });
        // declaration result
        sectionResult = {
          src: JSON.stringify(blockRenderings),
          value: declarationBlocks,
        };
      }
      // save rendering data
      result[sectionName] = sectionResult;
    });
    // result
    return result;
  }

  private renderInline(content: string) {
    [
      ...(content.match(/\[\[\[[^\]]*\]\]\]/g) || []),
      ...(content.match(/\{@render .*\}/g) || []),
    ].forEach(item => {
      const matched1Item =
        (/\[\[\[([^\]]*)\]\]\]/.exec(item) || []).pop() || '';
      const matched2Item = (/\{@render (.*)\}/.exec(item) || []).pop() || '';
      const [input, output = 'SELF', optionsStr] = (
        matched1Item || matched2Item
      )
        .split('|')
        .map(x => x.trim());
      const declaration = this.parseService.parse(input);
      const blocks = this.convertService.convert(
        declaration,
        output,
        optionsStr ? JSON.parse(optionsStr) : {}
      );
      const renderContent = this.contentService.renderContent(blocks);
      // replace
      content = content.replace(item, renderContent);
    });
    return content;
  }

  private processRenderInput(renderInput: FileRender, path: string) {
    let rendering: AdvancedRendering = {};
    let renderOptions: FileRenderWithOptions = {};
    // default file
    const defaultFile = '@doc' + '/' + path.replace('.html', '.md');
    if (renderInput === true) {
      rendering = {content: defaultFile};
    }
    // file input
    else if (
      typeof renderInput === 'string' &&
      renderInput.indexOf('.') !== -1 // a file
    ) {
      rendering = {content: renderInput};
    }
    // template
    else if (
      typeof renderInput === 'string' ||
      renderInput instanceof Function
    ) {
      rendering = this.templateService.getTemplate(
        renderInput as BuiltinTemplate | CustomTemplate
      );
    }
    // rendering
    else if (
      !renderInput.template &&
      !renderInput.rendering &&
      !renderInput.file
    ) {
      rendering = renderInput as AdvancedRendering;
    }
    // with options
    else {
      rendering = renderInput.template
        ? // template
          this.templateService.getTemplate(
            renderInput.template as BuiltinTemplate | CustomTemplate,
            renderInput as RenderTemplateOptions
          )
        : renderInput.file
        ? // file
          {
            content: renderInput.file === true ? defaultFile : renderInput.file,
          }
        : // rendering
          (renderInput.rendering as AdvancedRendering);
      // set options
      renderOptions = renderInput;
    }
    return {rendering, renderOptions};
  }

  private getDataHead() {
    const {name, description} = this.projectService.PACKAGE;
    return [this.contentService.blockText([`# ${name}`, `**${description}**`])];
  }

  private getDataLicense() {
    const {
      name,
      license,
      repository: {url: repoUrl},
    } = this.projectService.PACKAGE;
    const licenseUrl = repoUrl.replace('.git', '') + '/blob/master/LICENSE';
    return [
      this.contentService.blockText([
        '## License',
        `**${name}** is released under the [${license}](${licenseUrl}) license.`,
      ]),
    ];
  }

  private getDataTOC(blocks: ContentBlock[]) {
    const tocContent = this.contentService.renderTOC(blocks);
    return [this.contentService.blockText(tocContent)];
  }

  private getDataTOCX(blocks: ContentBlock[]) {
    const ref = this.contentService.blockHeading(
      'Detail API reference',
      2,
      undefined,
      this.projectService.REF_URL
    );
    blocks.push(ref); // add api ref link
    return this.getDataTOC(blocks);
  }
}
