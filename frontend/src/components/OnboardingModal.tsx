import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Compass,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  MapPin,
  TrendingUp,
  Waves,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const OnboardingModal: React.FC = () => {
  const {
    showOnboarding,
    setShowOnboarding,
    showGlossary,
    setShowGlossary,
    loadSampleArea,
  } = useResearch();

  const [currentTourStep, setCurrentTourStep] = useState(0);

  const tourSteps = [
    {
      title: 'Step 1: Choose Your Area on the Map',
      tagline: 'Pinpoint any study area in India with 4 corners',
      icon: MapPin,
      color: 'from-emerald-600 to-teal-500',
      description:
        'Start by clicking "Draw My Area" and tap 4 corners on the map (North-West, North-East, South-East, South-West). Our GIS engine immediately extracts elevation, hillside slopes, and tree cover.',
      actionHint: 'You can also click any pre-loaded river catchment directly on the map.',
    },
    {
      title: 'Step 2: See Priority & Compare Rankings',
      tagline: 'Know exactly which catchments need attention first',
      icon: TrendingUp,
      color: 'from-amber-600 to-orange-500',
      description:
        'View an administrative ranking of all catchments from #1 Most Urgent down to Low Priority. Sort by soil washed away, rain runoff, or bare land, and export the entire table for government DPR proposals.',
      actionHint: 'Color badges (Critical, High, Moderate, Low) make it easy to justify funding.',
    },
    {
      title: 'Step 3: Understand the Water Flow',
      tagline: 'See rainfall spikes, stream floods, and groundwater spots',
      icon: Waves,
      color: 'from-blue-600 to-cyan-500',
      description:
        'Examine a 30-day monsoon curve showing daily rainfall against stream discharge in cubic meters per second. The red dashed line flags flood risk days, while the TWI map shows the best spots for percolation ponds.',
      actionHint: 'Stream size levels (1 to 5) show where silt traps belong vs larger check dams.',
    },
    {
      title: 'Step 4: Plan Works & Test What-If Ideas',
      tagline: 'Get a certified budget and slide what-if changes live',
      icon: Sliders,
      color: 'from-purple-600 to-pink-500',
      description:
        'Get a complete Bill of Quantities (trenches in km, check dams count, farm ponds, tree planting) with estimated budgets in ₹ Lakhs. Move the live sliders to test how planting trees or adding check dams reduces urgency in under 10 milliseconds.',
      actionHint: 'Export a ready-to-submit DPR summary plan with one click.',
    },
  ];

  const glossaryTerms = [
    {
      term: 'Urgency Score (0 to 100)',
      plain: 'A composite score showing how badly an area needs soil and water treatment. Higher numbers (≥75) mean urgent emergency action is needed.',
      example: 'Score of 77 = Critical; Score of 35 = Safe / Low.',
    },
    {
      term: 'Soil Loss (t/ha/yr)',
      plain: 'The amount of valuable topsoil washed away by rain each year, measured in metric tonnes per hectare.',
      example: '32 t/ha/yr means heavy gully and rill erosion is destroying the farm soil.',
    },
    {
      term: 'Bare Soil %',
      plain: 'The share of land that has zero trees, bushes, or crops covering it. Rain hits bare soil directly and washes it away rapidly.',
      example: '45% bare soil means nearly half the catchment is unprotected dirt.',
    },
    {
      term: 'Runoff Potential',
      plain: 'How much rainwater flows immediately off the surface rather than soaking into the soil to recharge underground aquifers.',
      example: 'High runoff causes flash floods downstream and leaves local farms dry a few weeks later.',
    },
    {
      term: 'Flood Limit (Bankfull Capacity)',
      plain: 'The maximum water a stream channel can hold before water spills over the banks into surrounding farms and villages.',
      example: 'If storm discharge reaches 48 m³/s but capacity is 45 m³/s, water will overflow.',
    },
    {
      term: 'Water-Collecting Spots (TWI)',
      plain: 'Topographic Wetness Index: A computer calculation of low-lying spots where water naturally pools and soaks into the soil.',
      example: 'These spots are the best natural places to dig percolation ponds and farm tanks.',
    },
    {
      term: 'Contour Trenches (CCT)',
      plain: 'Continuous Contour Trenches: Shallow ditches dug along hillside contours to catch fast-moving sheet water and allow it to soak in.',
      example: 'Digging 34 km of trenches stops rainwater from gaining speed and cutting deep gullies.',
    },
    {
      term: 'Check Dams',
      plain: 'Small stone or concrete barriers built across small-to-medium stream gullies to slow down water and trap rich silt.',
      example: 'A series of 8 check dams slows torrential stream velocity and fills nearby wells.',
    },
    {
      term: 'Strahler Stream Order',
      plain: 'A number describing how big a stream is. Order 1 is a tiny hillside trickle, Order 3 is a stream, Order 5 is a main river.',
      example: 'Silt traps go on Order 1; check dams go on Orders 2 and 3.',
    },
    {
      term: 'Why This Score? (TreeSHAP)',
      plain: 'An explainable math breakdown showing exactly how many points were added or subtracted by each land factor.',
      example: 'Steep slopes add +26 points; existing forest trees subtract -7 points.',
    },
  ];

  if (!showOnboarding && !showGlossary) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Onboarding Welcome Tour Modal */}
      {showOnboarding && !showGlossary && (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
          <button
            onClick={() => setShowOnboarding(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tour Step Header */}
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Welcome Tour</span>
            <span>•</span>
            <span className="text-emerald-400">
              Step {currentTourStep + 1} of {tourSteps.length}
            </span>
          </div>

          {/* Tour Card Content */}
          <div className="space-y-4">
            {React.createElement(tourSteps[currentTourStep].icon, {
              className: 'w-12 h-12 text-emerald-400 p-2.5 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg',
            })}

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {tourSteps[currentTourStep].title}
              </h2>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                {tourSteps[currentTourStep].tagline}
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {tourSteps[currentTourStep].description}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{tourSteps[currentTourStep].actionHint}</span>
            </div>
          </div>

          {/* Step Indicator dots */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            {tourSteps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentTourStep ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Tour Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowOnboarding(false)}
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              Skip Tour
            </button>

            <div className="flex items-center space-x-2">
              {currentTourStep > 0 && (
                <button
                  onClick={() => setCurrentTourStep((prev) => prev - 1)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}

              {currentTourStep < tourSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentTourStep((prev) => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold flex items-center gap-1 shadow-md shadow-emerald-600/30"
                >
                  Next Step
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    loadSampleArea();
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Area & Begin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Glossary Modal */}
      {showGlossary && (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Plain-Language Glossary</h2>
                <p className="text-xs text-slate-400">
                  Every technical term explained in simple words for field teams and planners
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGlossary(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto space-y-3.5 pr-2 flex-1 scrollbar-thin">
            {glossaryTerms.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5"
              >
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {item.term}
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">{item.plain}</p>
                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                  <strong className="text-cyan-300">Example:</strong> {item.example}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setShowGlossary(false)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
            >
              Close Glossary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

