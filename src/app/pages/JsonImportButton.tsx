import { useState } from 'react';
import { backend } from '../backend';
import { useData } from '../DataContext';
import JsonImportDialog from './JsonImportDialog';

/**
 * Self-contained "add from JSON" button for the admin panel.
 * Usage: <JsonImportButton /> next to the "New opportunity" button.
 */
export default function JsonImportButton() {
  const { reload } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        JSON-dan əlavə et
      </button>
      {open && (
        <JsonImportDialog
          create={(input) => backend.createOpportunity(input)}
          onDone={() => {
            void reload();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
