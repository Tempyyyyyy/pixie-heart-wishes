import { Layout } from "@/components/launcher/Layout";
import { ModrinthBrowser } from "@/components/launcher/ModrinthBrowser";

const Resourcepacks = () => (
  <Layout>
    <ModrinthBrowser
      projectType="resourcepack"
      title="Текстур-паки"
      subtitle="Реалистичные, мультяшные, минималистичные — выбирай свой стиль."
    />
  </Layout>
);

export default Resourcepacks;
