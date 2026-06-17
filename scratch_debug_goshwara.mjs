import { generateGoshwaraReport } from './src/utils/goshwaraLogic.js';

const mockMembers = [
  { id: '1', age: 25, gender: 'Female', healthData: { isPregnant: true, ancStatus: 'active' } },
  { id: '2', age: 22, gender: 'Female', healthData: { isPregnant: true, ancStatus: 'registered' } }
];

const report = generateGoshwaraReport(mockMembers, [], [], [], 6, 2026);
console.log(JSON.stringify(report.stats.maternal, null, 2));
