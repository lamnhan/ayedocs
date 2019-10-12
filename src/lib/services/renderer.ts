import { Project } from './project';
import { ContentBySections, Block, Content } from './content';
import { Parser } from './parser';
import { ConvertOptions, Converter } from './converter';

export interface Rendering {
  [section: string]: true | SectionRendering;
}

export type SectionRendering =
  | BlockRendering // single
  | BlockRendering[]; // multiple

export type BlockRendering = Block | DeclarationRendering;
export type DeclarationRendering = [string, string?, ConvertOptions?];

export interface RenderingData {
  [section: string]: SectionRenderingData;
}

export type SectionRenderingData = Block[];

export interface BatchRendering {
  [id: string]: Rendering;
}

export interface BatchRenderingData {
  [id: string]: RenderingData;
}

export interface BatchRenderResult {
  [id: string]: string;
}

export class Renderer {
  private $Project: Project;
  private $Content: Content;
  private $Parser: Parser;
  private $Converter: Converter;

  constructor(
    $Project: Project,
    $Content: Content,
    $Parser: Parser,
    $Converter: Converter
  ) {
    this.$Project = $Project;
    this.$Content = $Content;
    this.$Parser = $Parser;
    this.$Converter = $Converter;
  }

  batchRender(
    batchRendering: BatchRendering,
    batchCurrentContent: {
      [id: string]: ContentBySections;
    } = {}
  ) {
    const batchResult: BatchRenderResult = {};
    Object.keys(batchRendering).forEach(id => {
      const rendering = batchRendering[id];
      const currentContent = batchCurrentContent[id] || {};
      batchResult[id] = this.render(rendering, currentContent);
    });
    return batchResult;
  }

  render(rendering: Rendering, currentContent: ContentBySections = {}) {
    // get rendering data
    const renderingData = this.getData(rendering);
    // merge data
    const data: {
      [section: string]: string | Block[];
    } = {
      ...currentContent,
      ...renderingData,
    };
    // render content
    const content: string[] = [];
    Object.keys(data).forEach(sectionName => {
      const sectionData = data[sectionName];
      // opening
      content.push(this.$Content.getSectionOpening(sectionName));
      // rendered content
      if (sectionData instanceof Array) {
        content.push(
          '<!-- AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY -->',
          this.$Content.renderContent(sectionData)
        );
      }
      // current content
      else {
        content.push(sectionData);
      }
      // closing
      content.push(this.$Content.getSectionClosing(sectionName));
    });
    // result
    return this.$Content.renderText(content);
  }

  getBatchData(batchRendering: BatchRendering) {
    const batchData: BatchRenderingData = {};
    Object.keys(batchRendering).forEach(
      id => (batchData[id] = this.getData(batchRendering[id]))
    );
    return batchData;
  }

  getData(rendering: Rendering) {
    const data: RenderingData = {};
    const tocData: Block[] = [];
    // get data for every section
    Object.keys(rendering).forEach(sectionName => {
      const sectionRendering = rendering[sectionName];
      let sectionBlocks: Block[] = [];
      // build-in sections
      if (sectionRendering === true) {
        // head
        if (sectionName === 'head') {
          sectionBlocks = this.getDataHead();
        }
        // license
        else if (sectionName === 'license') {
          sectionBlocks = this.getDataLicense();
        }
        // toc
        else if (sectionName === 'toc') {
          sectionBlocks = [];
        }
      }
      // declarations
      else {
        const declarationBlocks: Block[] = [];
        // turn single block rendering to multiple
        const blockRenderings =
          sectionRendering instanceof Array &&
          sectionRendering[0] instanceof Object // array or object
            ? // blocks or multi declarations
              (sectionRendering as BlockRendering[])
            : // a block or single declaration
              [sectionRendering as BlockRendering];
        // get section blocks
        blockRenderings.forEach(blockRendering => {
          // declaration
          if (blockRendering instanceof Array) {
            const [source, output = 'SELF', options = {}] = blockRendering;
            const what =
              !source || source === '*'
                ? undefined
                : source.indexOf('@') !== -1
                ? source.replace(/\@/g, 'src/').split('+')
                : source;
            const declaration = this.$Parser.parse(what);
            const blocks = this.$Converter.convert(
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
        // render content
        sectionBlocks = declarationBlocks;
      }
      // save rendering data
      data[sectionName] = sectionBlocks;
      // save toc data
      tocData.push(...sectionBlocks);
    });
    // add toc
    if (!!data.toc) {
      data.toc = this.getDataTOC(tocData);
    }
    // add attr
    if (!this.$Project.OPTIONS.noAttr) {
      data.attr = this.getDataAttr();
    }
    // result
    return data;
  }

  private getDataHead() {
    const { name, description } = this.$Project.PACKAGE;
    return [this.$Content.buildText([`# ${name}`, description])];
  }

  private getDataLicense() {
    const {
      name,
      license,
      repository: { url: repoUrl },
    } = this.$Project.PACKAGE;
    const licenseUrl = repoUrl.replace('.git', '') + '/blob/master/LICENSE';
    return [
      this.$Content.buildText([
        '## License',
        `**${name}** is released under the [${license}](${licenseUrl}) license.`,
      ]),
    ];
  }

  private getDataAttr() {
    return [
      this.$Content.buildText([
        '---',
        `⚡️ This document is generated automatically using [@lamnhan/autodocs](https://github.com/lamnhan/autodocs).`,
      ]),
    ];
  }

  private getDataTOC(blocks: Block[]) {
    const tocContent = this.$Content.renderTOC(blocks);
    return [this.$Content.buildText([`**Table of content**`, tocContent])];
  }
}
