package com.pixiestape.client.mixin;

import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.PlayerEntityRenderer;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.joml.Matrix4f;
import org.joml.Quaternionf;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import net.minecraft.client.MinecraftClient;

@Mixin(PlayerEntityRenderer.class)
public abstract class PlayerEntityRendererMixin {

    private static final Identifier PIXIE_ICON = Identifier.of("pixiestape", "textures/gui/icon.png");

    @Inject(method = "renderLabelIfPresent(Lnet/minecraft/client/network/AbstractClientPlayerEntity;Lnet/minecraft/text/Text;Lnet/minecraft/client/util/math/MatrixStack;Lnet/minecraft/client/render/VertexConsumerProvider;IF)V", at = @At("HEAD"))
    private void onRenderLabelIfPresent(AbstractClientPlayerEntity entity, Text text, MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light, float tickDelta, CallbackInfo ci) {
        // Do not render if sneaking
        if (entity.isSneaking()) return;

        // In 1.21.1, name tag is usually at height + 0.5F
        float height = entity.getHeight() + 0.5F;

        matrices.push();
        matrices.translate(0.0D, height, 0.0D);
        
        // Face the camera
        Quaternionf rotation = MinecraftClient.getInstance().getEntityRenderDispatcher().getRotation();
        matrices.multiply(rotation);
        
        // Scale down like text does
        matrices.scale(-0.025F, -0.025F, 0.025F);

        Matrix4f matrix4f = matrices.peek().getPositionMatrix();

        float iconSize = 9.0f;
        float textWidth = MinecraftClient.getInstance().textRenderer.getWidth(text);
        
        // Positive X goes to the LEFT because of scale(-0.025)
        // So (textWidth / 2) is the left edge of the text
        float startX = (textWidth / 2.0f) + 2.0f;
        // Text Y=0 is the top of the text, Y=8 is the bottom. Center is Y=4.
        float startY = 4.0f - (iconSize / 2.0f);

        VertexConsumer vertexConsumer = vertexConsumers.getBuffer(RenderLayer.getText(PIXIE_ICON));

        // Front face
        vertexConsumer.vertex(matrix4f, startX, startY, 0.0F).color(255, 255, 255, 255).texture(0.0F, 0.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX, startY + iconSize, 0.0F).color(255, 255, 255, 255).texture(0.0F, 1.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX + iconSize, startY + iconSize, 0.0F).color(255, 255, 255, 255).texture(1.0F, 1.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX + iconSize, startY, 0.0F).color(255, 255, 255, 255).texture(1.0F, 0.0F).light(light);

        // Back face (reverse order)
        vertexConsumer.vertex(matrix4f, startX + iconSize, startY, 0.0F).color(255, 255, 255, 255).texture(1.0F, 0.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX + iconSize, startY + iconSize, 0.0F).color(255, 255, 255, 255).texture(1.0F, 1.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX, startY + iconSize, 0.0F).color(255, 255, 255, 255).texture(0.0F, 1.0F).light(light);
        vertexConsumer.vertex(matrix4f, startX, startY, 0.0F).color(255, 255, 255, 255).texture(0.0F, 0.0F).light(light);

        matrices.pop();
    }
}
