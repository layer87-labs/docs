import AxeBuilder from '@axe-core/playwright';
import {guardPage, expect, test} from './helpers';

const PAGES = [
  '',
  'docs/relctl/intro',
  'docs/relctl/usage',
  'docs/relctl/cli/release',
  'docs/kube-escalate/architecture',
  'docs/webhull/reference/configuration',
];

/**
 * Known violations that are accepted for now. Each entry needs a reason; keep this list short.
 * Format: axe rule id -> reason.
 */
const ALLOWLIST: Record<string, string> = {};

for (const path of PAGES) {
  test(`axe: no critical or serious violations on /${path}`, async ({page, baseURL}) => {
    await guardPage(page, baseURL!);
    await page.goto(path, {waitUntil: 'load'});
    await page.waitForLoadState('networkidle');
    const {violations} = await new AxeBuilder({page}).analyze();
    const blocking = violations.filter(
      (v) => (v.impact === 'critical' || v.impact === 'serious') && !(v.id in ALLOWLIST),
    );
    const report = blocking
      .map((v) => `${v.impact} ${v.id}: ${v.help}\n${v.nodes.slice(0, 3).map((n) => `    ${n.target.join(' ')}\n      ${n.failureSummary?.split('\n').slice(0, 3).join(' | ')}`).join('\n')}`)
      .join('\n');
    expect(blocking, `Accessibility violations:\n${report}`).toEqual([]);
  });
}
