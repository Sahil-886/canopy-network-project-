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
import { DEFAULT_PARAMS } from '../engine/config';
import type { PipelineResult, Params, Grid } from '../engine/types';
import { executeOptimization, checkBackendHealth, type BackendStatus } from '../api';

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
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: false,
    engine: 'In-Browser TypeScript',
    url: '',
  });
  const initialRun = useRef(false);

  useEffect(() => {
    checkBackendHealth().then((st) => setBackendStatus(st));
  }, []);

  const handleRun = useCallback(
    async (p: Params, customGrid?: Grid) => {
      setParams(p);
      const { result: r, usedBackend } = await executeOptimization(p, customGrid);
      setResult(r);
      if (usedBackend && !backendStatus.online) {
        setBackendStatus({
          online: true,
          engine: 'Python FastAPI',
          url: 'http://localhost:8001',
        });
      }
    },
    [backendStatus.online]
  );

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F6F0] text-[#1C3527]">
      {/* Sticky Field Navigation */}
      <nav
        className="sticky top-0 z-50 bg-[#F5F6F0]/95 backdrop-blur-md border-b border-[#D7DECE]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="field-container flex items-center justify-between h-14">
          <a
            href="#"
            className="font-serif font-bold text-lg text-[#1C3527] no-underline hover:text-[#1F6B45] flex items-center gap-2"
          >
            <span className="text-xl">🌳</span>
            <span>{SITE.title}</span>
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden sm:flex items-center gap-5 list-none m-0 p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
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
                className="btn-primary text-xs py-1.5 px-3 no-underline shadow-xs"
              >
                Run Optimizer
              </a>
            </li>
          </ul>

          {/* Mobile Menu & Optimizer Action */}
          <div className="flex items-center gap-2 sm:hidden">
            <a
              href="#demo"
              className="btn-primary text-xs py-1 px-2.5 no-underline"
            >
              Run Optimizer
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#1C3527] hover:bg-[#E7ECE2] focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#D7DECE] bg-[#F5F6F0] px-4 pt-2 pb-4 space-y-1 shadow-lg animate-fadeIn">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded text-sm font-semibold text-[#1C3527] hover:bg-[#E7ECE2] no-underline transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
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
          backendStatus={backendStatus}
        />
        <ResultsSection result={result} />
        <CloseSection />
      </main>

      <Footer />
    </div>
  );
}
