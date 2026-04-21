import { Layout } from "@/components/launcher/Layout";
import { ModrinthBrowser } from "@/components/launcher/ModrinthBrowser";

const Plugins = () => (
  <Layout>
    <ModrinthBrowser
      projectType="plugin"
      title="Плагины для серверов"
      subtitle="Bukkit, Spigot, Paper, Velocity, BungeeCord — для администраторов серверов."
    />
  </Layout>
);

export default Plugins;
