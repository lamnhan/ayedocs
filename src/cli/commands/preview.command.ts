import {yellow, green} from 'chalk';

import {ContentService} from '../../lib/services/content.service';
import {ConvertService} from '../../lib/services/convert.service';
import {ParseService} from '../../lib/services/parse.service';

export class PreviewCommand {
  constructor(
    private contentService: ContentService,
    private convertService: ConvertService,
    private parseService: ParseService
  ) {}

  run(input = '*', output = 'SELF', params: string[] = []) {
    const options = this.extractOptions(params);
    // render
    const declaration = this.parseService.parse(input);
    const blocks = this.convertService.convert(declaration, output, options);
    const previewContent = this.contentService.renderContent(blocks);
    // output
    const convertInput = [
      '[',
      `'${input}'`,
      ', ',
      `'${output}'`,
      !params.length
        ? ''
        : ', ' +
          JSON.stringify(options)
            .replace(/{"/g, '{')
            .replace(/,"/g, ', ')
            .replace(/":/g, ': ')
            .replace(/"/g, "'"),
      ']',
    ].join('');
    console.log(`\nPreview content for ${yellow(convertInput)}:\n`);
    console.log(green(previewContent));
  }

  private extractOptions(params: string[]): {[key: string]: any} {
    const parseValue = (value: any) => {
      if ((value + '').toLowerCase() === 'true') {
        // TRUE
        value = true;
      } else if ((value + '').toLowerCase() === 'false') {
        // FALSE
        value = false;
      } else if (!isNaN(value)) {
        // number
        value = Number(value);
      } else {
        // JSON
        try {
          value = JSON.parse(value);
        } catch (e) {
          /* invalid json, keep value as is */
        }
      }
      return value;
    };
    // extract data
    const result: any = {};
    params.forEach(item => {
      const multipleSplit = item.split('|');
      multipleSplit.forEach(single => {
        const singleSplit = single.trim().split('=');
        if (singleSplit[1]) {
          result[singleSplit[0].trim()] = parseValue(singleSplit[1].trim());
        }
      });
    });
    // result
    return result;
  }
}
