import { useState } from 'preact/hooks';
import { ErrorBar } from './components/ErrorBar';
import { MergeView } from './components/MergeView';
import { SettingsPanel } from './components/SettingsPanel';
import { SplitView } from './components/SplitView';
import { useImageProcessing } from './hooks/useImageProcessing';
import { describeWorkerMode } from './utils/imageClient';
import {
  DEFAULT_MERGE_SETTINGS,
  DEFAULT_SPLIT_SETTINGS,
} from './utils/pipeline';
import type { MergeSettings, SplitSettings } from './utils/pipeline';
import type { Mode } from './types';

export function App() {
  const [mode, setMode] = useState<Mode>('merge');
  const [mergeSettings, setMergeSettings] =
    useState<MergeSettings>(DEFAULT_MERGE_SETTINGS);
  const [splitSettings, setSplitSettings] =
    useState<SplitSettings>(DEFAULT_SPLIT_SETTINGS);

  const {
    fileA,
    fileB,
    sourceFile,
    selectFileA,
    selectFileB,
    selectSource,
    mergedBitmap,
    splitResult,
    busy,
    error,
    reportError,
    clearError,
    forceRun,
  } = useImageProcessing({ mode, mergeSettings, splitSettings });

  const updateMergeSettings = (patch: Partial<MergeSettings>) =>
    setMergeSettings((previous) => ({ ...previous, ...patch }));

  const updateSplitSettings = (patch: Partial<SplitSettings>) =>
    setSplitSettings((previous) => ({ ...previous, ...patch }));

  const syncSplitFromMerge = () =>
    setSplitSettings({
      imgABrightness: mergeSettings.aWhiteOpacity,
      imgBBrightness: mergeSettings.bBlackOpacity,
      offset: mergeSettings.offset,
    });

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    clearError();
  };

  return (
    <div class="app">
      <header class="app-header">
        <div class="brand">
          <h1>Shadow Tank Images</h1>
          <p class="subtitle">棋盘格隐图 · 合并与拆分</p>
        </div>

        <nav class="tabs" aria-label="模式切换">
          {(
            [
              ['merge', '合并'],
              ['split', '拆分'],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              type="button"
              class={['tab', mode === value ? 'is-active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => switchMode(value)}
            >
              {label}
            </button>
          ))}
          {busy && (
            <span class="busy">
              <span class="spinner" aria-hidden="true" />
              处理中…
            </span>
          )}
        </nav>
      </header>

      {error && <ErrorBar message={error} onClose={clearError} />}

      <SettingsPanel
        mode={mode}
        mergeSettings={mergeSettings}
        splitSettings={splitSettings}
        onMergeChange={updateMergeSettings}
        onSplitChange={updateSplitSettings}
        onSyncFromMerge={syncSplitFromMerge}
      />

      {mode === 'merge' ? (
        <MergeView
          fileA={fileA}
          fileB={fileB}
          mergedBitmap={mergedBitmap}
          busy={busy}
          onSelectA={selectFileA}
          onSelectB={selectFileB}
          onForceRun={forceRun}
          onError={reportError}
        />
      ) : (
        <SplitView
          sourceFile={sourceFile}
          splitResult={splitResult}
          busy={busy}
          onSelectSource={selectSource}
          onForceRun={forceRun}
          onError={reportError}
        />
      )}

      <footer class="app-footer">
        <span>处理引擎：{describeWorkerMode()}</span>
        <span>
          <a href="https://github.com/MisaLiu/shadow-tank-images" target="_blank">GitHub</a> 
          ·版本 {__GIT_SHORT_HASH__}
        </span>
      </footer>
    </div>
  );
}
