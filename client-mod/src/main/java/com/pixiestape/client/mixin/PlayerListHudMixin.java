package com.pixiestape.client.mixin;

import net.minecraft.client.gui.hud.PlayerListHud;
import net.minecraft.client.network.PlayerListEntry;
import net.minecraft.text.MutableText;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(PlayerListHud.class)
public class PlayerListHudMixin {

    @Inject(method = "getPlayerName", at = @At("RETURN"), cancellable = true)
    private void onGetPlayerName(PlayerListEntry entry, CallbackInfoReturnable<Text> cir) {
        Text original = cir.getReturnValue();
        if (original == null) {
            // Vanilla falls back to entry.getProfile().getName() if getDisplayName() is null
            original = Text.literal(entry.getProfile().getName());
        }
        
        // Prepend the custom font character \uE000
        MutableText newText = Text.literal("\uE000 ").append(original);
        cir.setReturnValue(newText);
    }
}
