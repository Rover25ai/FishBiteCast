'use client';

import { SettingsForm } from '@/components/settings-form';

export default function SettingsPage(): JSX.Element {
  return (
    <div className="page-stack">
      <section className="card">
        <h2 className="section-title">Settings</h2>
        <p className="helper-text">Update units and species preset. Forecast scores recalculate automatically.</p>
      </section>

      <SettingsForm />
    </div>
  );
}
