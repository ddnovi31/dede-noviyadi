/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
import CableDesigner from './components/CableDesigner';
import TDSLayoutSettings from './components/designer/TDSLayoutSettings';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.includes('#tds-layout')) {
    return <TDSLayoutSettings />;
  }

  return (
    <CableDesigner />
  );
}
