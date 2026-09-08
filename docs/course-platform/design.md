# Course platform design

The user requests a Scaffold-based public course with TypeScript interactive pages, Python learning examples, and broad applicability across developer backgrounds and budgets. Existing lessons, Markdown sources, progress records, audio, and working interactions must survive the migration. A rewrite is authorized where useful, but preserving working learning tools avoids unnecessary regression.

The teaching order is definition, visual example, worked walkthrough, guided experiment, retrieval, and independent transfer. Each concept has contextual links to external primary readings and media. No paid service is necessary to read or practice the basic course.

Routes are prerequisite bridge, standard developer path, and accelerated experienced-engineer path. Hardware is a scaling choice: CPU fundamentals, one-GPU experiments, optional distributed/cloud extensions. Calendar estimates must state workload assumptions and never guarantee employment.

TypeScript source lives in src/site; generated browser modules remain static assets. Node tooling builds and previews the course. Scaffold's sync manifest installs its shared harness, with course-owned instructions and deployment workflows protected. Python training examples remain Python.
