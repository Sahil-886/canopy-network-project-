import { useState, useEffect, useCallback, useRef } from 'react';
import { SITE } from '../content';
import Hero from './Hero';
import ProblemSection from './ProblemSection';
import MethodSection from './MethodSection';
import AlgorithmsTable from './AlgorithmsTable';
import Demo from './Demo/Demo';
import ResultsSection from './ResultsSection';
import CloseSection from './CloseSection';
import Footer from './Footer';
import { generateCity } from '../engine/city';
import { runPipeline } from '../engine';
import { DEFAULT_PARAMS } from '../engine/config';
import type { PipelineResult, Params, Grid } from '../engine/types';

const NAV_ITEMS = [
  { id: 'problem', label: 'The Problem' },
  { id: 'solution', label: 'Three-Stage Solution' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'demo', label: 'Interactive Demo' },
  { id: 'results', label: 'Evaluation' },
  { id: 'close', label: 'Synthesis & Team' },
];

export default function App() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [activeStep, setActiveStep] = useState(0);
  const initialRun = useRef(false);

  const handleRun = useCallback((p: Params, customGrid?: Grid) => {
    const city = customGrid || generateCity(p.seed, p.width, p.height);
    const r = runPipeline(city, p);
    setResult(r);
    setParams(p);
  }, []);

  useEffect(() => {
    if (!initialRun.current) {
      initialRun.current = true;
      handleRun(DEFAULT_PARAMS);
    }
  }, [handleRun]);

  const handleSelectStage = (stageIndex: number) => {
    // Map stage 0, 1, 2 to step-through indices (Stage 1 = step 1, Stage 2 = step 4, Stage 3 = step 5)
    const stepMap = [1, 4, 5];
    setActiveStep(stepMap[stageIndex] ?? 0);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F0] text-[#1C3527]">
      {/* Sticky Field Navigation */}
      <nav
        className="sticky top-0 z-50 bg-[#F5F6F0]/90 backdrop-blur-md border-b border-[#D7DECE]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="field-container flex items-center justify-between h-14">
          <a
            href="#"
            className="font-serif font-bold text-lg text-[#1C3527] no-underline hover:text-[#1F6B45]"
          >
            {SITE.title}
          </a>
          <ul className="flex items-center gap-5 list-none m-0 p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className="hidden sm:block">
                <a
                  href={`#${item.id}`}
                  className="text-xs font-semibold text-[#3D5A49] hover:text-[#1F6B45] no-underline transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#demo"
                className="btn-primary text-xs py-1.5 px-3 no-underline"
              >
                Run Optimizer
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <Hero result={result} />
        <ProblemSection />
        <MethodSection onSelectStage={handleSelectStage} />
        <AlgorithmsTable />
        <Demo
          result={result}
          params={params}
          onRun={handleRun}
          currentStep={activeStep}
          onStepChange={setActiveStep}
        />
        <ResultsSection result={result} />
        <CloseSection />
      </main>

      <Footer />
    </div>
  );
}
