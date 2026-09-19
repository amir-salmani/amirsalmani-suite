/* Two jobs. Without ?demo= it loads every module, which is the build assertion.
 * With ?demo=<name> it renders one demo alone on the ground, which is what
 * tools/record-demos.mjs films.
 */
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { DEMOS } from './demos.generated';

const name = new URLSearchParams(location.search).get('demo');
const root = createRoot(document.getElementById('root')!);

if (!name) {
  const modules = (await import('./every-item.generated')).default;
  root.render(<pre>{Object.keys(modules).length} modules loaded</pre>);
} else {
  const Demo = DEMOS[name];
  if (!Demo) {
    document.body.dataset.state = 'missing';
    root.render(<pre>no demo: {name}</pre>);
  } else {
    root.render(
      <StrictMode>
        <Suspense fallback={null}>
          <div
            data-demo={name}
            style={{
              minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)',
              display: 'grid', alignContent: 'center', justifyItems: 'stretch', padding: '2rem',
            }}
          >
            <Demo />
          </div>
        </Suspense>
      </StrictMode>,
    );
    // The recorder waits on this rather than a fixed timeout: a WebGL item that
    // takes two seconds to compile would otherwise be filmed black.
    requestAnimationFrame(() => requestAnimationFrame(() => { document.body.dataset.state = 'ready'; }));
  }
}
