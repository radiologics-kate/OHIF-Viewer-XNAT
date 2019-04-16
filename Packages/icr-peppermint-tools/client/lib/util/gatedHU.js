export default {
  //https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4309522/
  adipose: [-190, -30],
  muscle: [-29, 150],

  //https://www.ncbi.nlm.nih.gov/pubmed/21932054
  //boneCortical: [500, 900],

  boneCancellous: [150, 1900],

  custom: [0, 0]
};

// TODO -> This is the list from wikipedia, but there are lots of
// Conflicting ranges in various literature. Which one to use?
/*
export default {
  //fat: [-120, -90],
  fat: [-150, -50],
  softTissueContrastCT: [100, 300],
  boneCancellous: [300, 400],
  boneCortical: [1800, 1900],
  subduralHemotomaFirstHours: [75, 100],
  subduralHemotomaAfter3Days: [65, 85],
  subduralHemotoma10To14Days: [35, 40],
  bloodUnclotted: [13, 50],
  bloodClotted: [50, 75],
  pleuralEffusionTransudate: [2, 15],
  pleuralEffusionExudate: [4, 33],
  chyle: [-31, -29], // TODO -> -30 on Wikipedia
  water: [-1, 1], // TODO -> water is defined to be zero, so what range should I allow.
  urine: [-5, 15],
  bile: [-5, 15],
  csf: [14, 16], // TODO -> +15 on Wikipedia
  mucus: [0, 130],
  lung: [-700, -600],
  kidney: [20, 45],
  liver: [54, 66],
  lymphNodes: [10, 20],
  muscle: [35, 55],
  thymusChild: [20, 40],
  thymusAdult: [20, 120],
  whiteMatter: [20, 30],
  greyMatter: [37, 45],
  gallstoneCholesterol: [30, 100],
  gallstoneBilirubin: [90, 120],
  custom: [0, 0]
};
*/
