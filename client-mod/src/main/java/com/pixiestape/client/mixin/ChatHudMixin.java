package com.pixiestape.client.mixin;

import net.minecraft.client.gui.hud.ChatHud;
import net.minecraft.client.gui.hud.MessageIndicator;
import net.minecraft.network.message.MessageSignatureData;
import net.minecraft.text.MutableText;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyVariable;

@Mixin(ChatHud.class)
public class ChatHudMixin {

    @ModifyVariable(
        method = "addMessage(Lnet/minecraft/text/Text;Lnet/minecraft/network/message/MessageSignatureData;Lnet/minecraft/client/gui/hud/MessageIndicator;)V",
        at = @At("HEAD"),
        argsOnly = true,
        ordinal = 0
    )
    private Text modifyChatMessage(Text message) {
        // A simple trick to add the icon to chat messages:
        // If the message contains the player's name format (e.g. "<Name>"), we can prepend the icon!
        // For absolute safety without breaking formatting, we just prepend the icon to the entire line for now.
        // In a full client, you'd use a TextVisitor to find the exact node containing the name.
        
        // This prepends the fairy icon to EVERY chat message. 
        // In a real scenario, you'd check if the message sender is using Pixiestape.
        return Text.literal("\uE000 ").append(message);
    }
}
