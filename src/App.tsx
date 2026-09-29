import { useInteractions } from './hooks/useInteractions';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProgramStrip from './components/ProgramStrip';
import BackToTop from './components/BackToTop';
import LiveOpportunities from './components/LiveOpportunities';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';

/** The marketing landing page at "/". */
export default function App() {
  useInteractions();

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <ProgramStrip />
        <LiveOpportunities />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
