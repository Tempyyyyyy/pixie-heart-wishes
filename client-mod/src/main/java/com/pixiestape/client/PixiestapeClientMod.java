package com.pixiestape.client;

import net.fabricmc.api.ClientModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PixiestapeClientMod implements ClientModInitializer {
    public static final Logger LOGGER = LoggerFactory.getLogger("pixiestape");

    @Override
    public void onInitializeClient() {
        LOGGER.info("Pixiestape client mod initialized! Rendering user icons.");
    }
}
