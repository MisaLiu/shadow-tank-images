import { useEffect, useRef, useState } from 'preact/hooks';
import { processMerge, processSplit } from '../utils/imageClient';
import { toErrorMessage } from '../utils/pipeline';
import type { MergeSettings, SplitSettings } from '../utils/pipeline';
import type { Mode } from '../types';

const PROCESS_DEBOUNCE_MS = 200;

type Options = {
  mode: Mode;
  mergeSettings: MergeSettings;
  splitSettings: SplitSettings;
};

type SplitResult = { a: Blob; b: Blob };

export const useImageProcessing = ({ mode, mergeSettings, splitSettings }: Options) => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const runSeq = useRef(0);

  useEffect(() => {
    if (mode === 'merge') {
      if (!fileA || !fileB) {
        runSeq.current++;
        setBusy(false);
        return;
      }

      const runId = ++runSeq.current;
      setBusy(true);
      setError(null);

      const timer = setTimeout(() => {
        processMerge(fileA, fileB, mergeSettings)
          .then((blob) => {
            if (runId !== runSeq.current) return;
            setMergedBlob(blob);
          })
          .catch((cause: unknown) => {
            if (runId !== runSeq.current) return;
            setError(toErrorMessage(cause));
          })
          .finally(() => {
            if (runId === runSeq.current) setBusy(false);
          });
      }, PROCESS_DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }

    if (!sourceFile) {
      runSeq.current++;
      setBusy(false);
      return;
    }

    const runId = ++runSeq.current;
    setBusy(true);
    setError(null);

    const timer = setTimeout(() => {
      processSplit(sourceFile, splitSettings)
        .then(({ a, b }) => {
          if (runId !== runSeq.current) return;
          setSplitResult({ a, b });
        })
        .catch((cause: unknown) => {
          if (runId !== runSeq.current) return;
          setError(toErrorMessage(cause));
        })
        .finally(() => {
          if (runId === runSeq.current) setBusy(false);
        });
    }, PROCESS_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [mode, fileA, fileB, sourceFile, mergeSettings, splitSettings, nonce]);

  const selectFileA = (file: File | null) => {
    setFileA(file);
    setMergedBlob(null);
  };

  const selectFileB = (file: File | null) => {
    setFileB(file);
    setMergedBlob(null);
  };

  const selectSource = (file: File | null) => {
    setSourceFile(file);
    setSplitResult(null);
  };

  return {
    fileA,
    fileB,
    sourceFile,
    selectFileA,
    selectFileB,
    selectSource,
    mergedBlob,
    splitResult,
    busy,
    error,
    reportError: setError,
    clearError: () => setError(null),
    forceRun: () => setNonce((value) => value + 1),
  };
};
