import {
  DEFAULT_MERGE_SETTINGS,
  DEFAULT_SPLIT_SETTINGS,
} from '../utils/pipeline';
import type { MergeSettings, SplitSettings } from '../utils/pipeline';
import type { Mode } from '../types';

type Props = {
  mode: Mode;
  mergeSettings: MergeSettings;
  splitSettings: SplitSettings;
  onMergeChange: (patch: Partial<MergeSettings>) => void;
  onSplitChange: (patch: Partial<SplitSettings>) => void;
  onSyncFromMerge: () => void;
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label class="slider-row">
      <span class="slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange(Number(e.currentTarget.value))}
      />
      <span class="slider-value">{value.toFixed(3)}</span>
    </label>
  );
}

function OffsetControl({
  value,
  onChange,
}: {
  value: 0 | 1;
  onChange: (value: 0 | 1) => void;
}) {
  return (
    <div class="slider-row">
      <span class="slider-label">棋盘偏移 offset</span>
      <div class="segmented" role="group" aria-label="棋盘偏移">
        {[0, 1].map((option) => (
          <button
            type="button"
            class={['segment', value === option ? 'is-active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(option as 0 | 1)}
          >
            {option}
          </button>
        ))}
      </div>
      <span class="slider-value">{value}</span>
    </div>
  );
}

export function SettingsPanel({
  mode,
  mergeSettings,
  splitSettings,
  onMergeChange,
  onSplitChange,
  onSyncFromMerge,
}: Props) {
  if (mode === 'merge') {
    return (
      <section class="panel">
        <div class="panel-head">
          <h2>
            合并设置 <code>mergeImagesToCheckerboard</code>
          </h2>
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => onMergeChange(DEFAULT_MERGE_SETTINGS)}
          >
            重置
          </button>
        </div>

        <div class="sliders">
          <Slider
            label="A 白底不透明度"
            value={mergeSettings.aWhiteOpacity}
            min={0}
            max={1}
            step={0.005}
            onChange={(value) => onMergeChange({ aWhiteOpacity: value })}
          />
          <Slider
            label="B 黑底不透明度"
            value={mergeSettings.bBlackOpacity}
            min={0}
            max={1}
            step={0.005}
            onChange={(value) => onMergeChange({ bBlackOpacity: value })}
          />
          <OffsetControl
            value={mergeSettings.offset}
            onChange={(value) => onMergeChange({ offset: value })}
          />
        </div>

        <p class="panel-hint">
          A 与 B 逐像素按棋盘格交错叠加，mask 为 0 的像素取 A，mask 为 1 的像素取 B。
        </p>
      </section>
    );
  }

  return (
    <section class="panel">
      <div class="panel-head">
        <h2>
          拆分设置 <code>splitMergedImages</code>
        </h2>
        <div class="panel-actions">
          <button type="button" class="btn btn-ghost" onClick={onSyncFromMerge}>
            填入合并参数
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => onSplitChange(DEFAULT_SPLIT_SETTINGS)}
          >
            重置
          </button>
        </div>
      </div>

      <div class="sliders">
        <Slider
          label="图 A 亮度"
          value={splitSettings.imgABrightness}
          min={0}
          max={1}
          step={0.005}
          onChange={(value) => onSplitChange({ imgABrightness: value })}
        />
        <Slider
          label="图 B 亮度"
          value={splitSettings.imgBBrightness}
          min={0}
          max={1}
          step={0.005}
          onChange={(value) => onSplitChange({ imgBBrightness: value })}
        />
        <OffsetControl
          value={splitSettings.offset}
          onChange={(value) => onSplitChange({ offset: value })}
        />
      </div>

      <p class="panel-hint">
        图 A / 图 B 亮度与棋盘偏移 offset
        需与合并时的对应参数一致才能无损还原，可点击「填入合并参数」快速对齐。
      </p>
    </section>
  );
}
