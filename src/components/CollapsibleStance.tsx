'use client';

import { useState, type ComponentProps } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import StanceBoard, { type Pred } from './match/StanceBoard';

// 「完整预测」下拉：默认收起（不剧透即将开赛的 AI 预测），点击展开内联站队板。
export default function CollapsibleStance({
  predictions,
  homeName,
  awayName,
  isKnockout,
  t,
  expandLabel,
  collapseLabel,
}: {
  predictions: Pred[];
  homeName: string;
  awayName: string;
  isKnockout: boolean;
  t: ComponentProps<typeof StanceBoard>['t'];
  expandLabel: string;
  collapseLabel: string;
}) {
  const [open, setOpen] = useState(false);
  if (predictions.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1.5 rounded-card border border-hairline bg-canvas-card py-2.5 text-sm text-body transition-colors hover:border-mute"
      >
        {open ? collapseLabel : expandLabel}
        <IconChevronDown
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-4">
          <StanceBoard
            predictions={predictions}
            homeName={homeName}
            awayName={awayName}
            isKnockout={isKnockout}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
