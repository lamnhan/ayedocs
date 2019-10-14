import { EOL } from 'os';
import { readFileSync, outputFileSync } from 'fs-extra';
import { format as prettierFormater } from 'prettier';
import { ConverterOptions, Converter } from 'showdown';

export interface ContentBySections {
  [section: string]: string;
}

export type Block = BlockHeader | BlockText | BlockList | BlockTable;

export interface Header {
  id: string;
  level: number;
  title: string;
  link?: string;
}
export interface BlockHeader {
  type: 'header';
  data: Header;
}

export type Text = string | string[];
export interface BlockText {
  type: 'text';
  data: Text;
}

export type List = Array<[string, string]>;
export interface BlockList {
  type: 'list';
  data: List;
}

export type Table = string[][];
export interface BlockTable {
  type: 'table';
  data: Table;
}

export class Content {
  EOL2X = EOL.repeat(2);

  constructor() {}

  readFileSync(path: string) {
    return readFileSync(path, 'utf-8');
  }

  writeFileSync(path: string, content: string) {
    return outputFileSync(path, content);
  }

  getSectionOpening(id: string, attrs: { [attr: string]: string } = {}) {
    let attrsStr = '';
    Object.keys(attrs).forEach(key => (attrsStr += ` ${key}="${attrs[key]}"`));
    return `<section id="${id}"${attrsStr}>`;
  }

  getSectionClosing() {
    return '</section>';
  }

  extractSections(content: string) {
    const result: ContentBySections = {};
    const matched = content.match(/<section[^>]*>([\s\S]*?)<\/section>/g);
    (matched || []).forEach(item => {
      const id = (/<section id="(.*?)"/.exec(item) || []).pop();
      if (!!id) {
        result[id] = this.format(
          item.replace(/<section [^\n]*/g, '').replace('</section>', '')
        );
      }
    });
    return result;
  }

  extractHeadings(content: string) {
    const headings: BlockHeader[] = [];
    (content.match(/\n#{1}[^\n]*/g) || []).forEach(heading => {
      const [head, ...body] = heading.replace(/(?:\r\n|\r|\n)/g, '').split(' ');
      const level = head.length;
      if (level < 7) {
        const title = body.join(' ').replace(new RegExp(' ' + head, 'g'), '');
        const id = this.buildId(title);
        headings.push(this.buildHeader(id, level, title));
      }
    });
    return headings;
  }

  md2Html(mdContent: string, options?: ConverterOptions) {
    return new Converter(options).makeHtml(mdContent);
  }

  format(content: string) {
    return prettierFormater(content, { parser: 'markdown' });
  }

  buildId(title: string) {
    return title
      .trim()
      .toLowerCase()
      .replace(/[^\w\- ]+/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/\-+$/, '');
  }

  buildHeader(id: string, level: number, title: string, link?: string) {
    return {
      type: 'header',
      data: { id, level, title, link },
    } as BlockHeader;
  }

  buildText(text: Text) {
    return { type: 'text', data: text } as BlockText;
  }

  buildList(list: List) {
    return { type: 'list', data: list } as BlockList;
  }

  buildTable(headers: string[], rows: string[][]) {
    rows.unshift(headers); // add headers
    return { type: 'table', data: rows } as BlockTable;
  }

  renderTOC(blocks: Block[]) {
    const rows: string[] = [];
    blocks.forEach(({ type, data }) => {
      if (type === 'header') {
        const { id, title, level } = data as Header;
        rows.push(`${'  '.repeat(level - 1)}- [${title}](#${id})`);
      }
    });
    return this.format(rows.join(EOL));
  }

  renderContent(blocks: Block[]) {
    const result = blocks.map(block => this.renderBlock(block));
    return this.format(result.join(this.EOL2X));
  }

  renderBlock({ type, data }: Block) {
    let content = '';
    switch (type) {
      case 'header':
        content = this.renderHeader(data as Header);
        break;
      case 'list':
        content = this.renderList(data as List);
        break;
      case 'table':
        content = this.renderTable(data as Table);
        break;
      case 'text':
      default:
        content = this.renderText(data as Text);
        break;
    }
    return content;
  }

  renderHeader({ id, title, level, link }: Header) {
    const h = 'h' + level;
    const a = `a name="${id}"` + (!!link ? ` href="${link}"` : ``);
    return this.format(`<${h}><${a}>${this.md2Html(title)}</a></${h}>`);
  }

  renderText(text: Text, single = false) {
    return this.format(
      typeof text === 'string' ? text : text.join(single ? EOL : this.EOL2X)
    );
  }

  renderList(list: List) {
    const blocks = list.map(
      ([title, description = '']) => `- ${title}: ${description}`
    );
    return this.format(blocks.join(EOL));
  }

  renderTable([headers, ...rows]: Table) {
    const tableRows = rows.map(cells => {
      // process value
      cells = cells.map(x => (x || '').replace(/\|/g, '\\|'));
      // build row
      return '| ' + cells.join(' | ') + ' |';
    });
    return this.format(
      [
        '| ' + headers.join(' | ') + ' |',
        '| --- | --- | --- |',
        ...tableRows,
      ].join(EOL)
    );
  }
}
