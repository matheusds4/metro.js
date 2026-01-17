import { Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Table styles.
 * @hidden
 */
export function TableSkin(theme: Theme): string {
  return `
    && table {
      margin: 0 auto;
      border-collapse: collapse;
    }
    && table td {
      padding: 3px 20px;
      border: 0.2rem ${ColorUtils.sc(theme.colors.foreground, 0.5)} solid;
    }
    && table thead {
      background: ${ColorUtils.sc(theme.colors.foreground, 0.8)};
    }
    && table thead td {
      font-weight: 700;
      border: none;
    }
    && table td,
    && table tr {
      font-size: 1rem;
    }
    && table thead th {
      padding: 3px 20px;
      border: 0.2rem ${ColorUtils.sc(theme.colors.foreground, 0.5)} solid;
    }
    && table tbody tr:nth-of-type(2n) {
      background: ${ColorUtils.sc(theme.colors.foreground, 0.8)};
    }
  `;
}