/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import CableDesigner from './components/CableDesigner';
import TDSLayoutSettings from './components/designer/TDSLayoutSettings';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '#tds-layout') {
    return <TDSLayoutSettings />;
  }

  return (
    <CableDesigner />
  );
}
