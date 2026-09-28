import { useInteractions } from './hooks/useInteractions';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProgramStrip from './components/ProgramStrip';
import BackToTop from './components/BackToTop';
import Features from './components/Features';
import AppPreview from './components/AppPreview';
import Pricing from './components/Pricing';
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
        <Features />
        <AppPreview />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
