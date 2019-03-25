import { projects } from "./projects.js";
import { ITCRdemo_subjects } from "./ITCRdemo/subjects.js";
import { ITCRdemo_XNAT_JPETTS_S00011_experiments } from "./ITCRdemo/XNAT_JPETTS_S00011/experiments.js";
import { ITCRdemo_XNAT_JPETTS_S00012_experiments } from "./ITCRdemo/XNAT_JPETTS_S00012/experiments.js";
import { TESTViewer_subjects } from "./TEST_Viewer/subjects.js";
import { TEST_Viewer_XNAT_JPETTS_S00021_experiments } from "./TEST_Viewer/XNAT_JPETTS_S00032/experiments.js";

const uriToJson = {
  "/data/archive/projects/?format=json": projects,
  "/data/archive/projects/ITCRdemo/subjects?format=json": ITCRdemo_subjects,
  "/data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00011/experiments?format=json": ITCRdemo_XNAT_JPETTS_S00011_experiments,
  "/data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00012/experiments?format=json": ITCRdemo_XNAT_JPETTS_S00012_experiments,
  "/data/archive/projects/TEST_Viewer/subjects?format=json": TESTViewer_subjects,
  "/data/archive/projects/TEST_Viewer/subjects/XNAT_JPETTS_S00032/experiments?format=json": TEST_Viewer_XNAT_JPETTS_S00021_experiments
};

export default function(uri) {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve(uriToJson[uri]);
    }, 200);
  });
}
