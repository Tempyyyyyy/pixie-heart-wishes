package com.pixiestape.client.mixin;

import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRenderDispatcher;
import net.minecraft.client.render.entity.EntityRenderer;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.Entity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.joml.Matrix4f;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(EntityRenderer.class)
public abstract class EntityRendererMixin<T extends Entity> {

    @Shadow public abstract EntityRenderDispatcher getDispatcher();

    // The fairy icon we copied to assets/pixiestape/textures/gui/icon.png
    private static final Identifier PIXIE_ICON = Identifier.of("pixiestape", "textures/gui/icon.png");

    @Inject(method = "renderLabelIfPresent", at = @At("HEAD"))
    private void onRenderLabelIfPresent(T entity, Text text, MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light, float tickDelta, CallbackInfo ci) {
        if (entity instanceof AbstractClientPlayerEntity player) {
            // Do not render if too far
            double d = this.getDispatcher().getSquaredDistanceToCamera(entity);
            if (d > 4096.0D) return;
            
            // Do not render if sneaking (optional, standard vanilla behavior for names)
            if (entity.isSneaking()) return;

            // Height is slightly above the name tag
            float height = entity.getNameLabelHeight() + 0.3F;

            matrices.push();
            matrices.translate(0.0D, height, 0.0D);
            matrices.multiply(this.getDispatcher().getRotation());
            matrices.scale(-0.025F, -0.025F, 0.025F);

            Matrix4f matrix4f = matrices.peek().getPositionMatrix();

            // Draw a 12x12 icon centered horizontally
            float iconSize = 12.0f;
            float offset = -iconSize / 2.0f;

            // We use RenderLayer.getText(PIXIE_ICON) which works perfectly for 2D overlays in world
            VertexConsumer vertexConsumer = vertexConsumers.getBuffer(RenderLayer.getText(PIXIE_ICON));

            vertexConsumer.vertex(matrix4f, offset, offset, 0.01F)
                          .color(255, 255, 255, 255)
                          .texture(0.0F, 0.0F)
                          .light(light);
            vertexConsumer.vertex(matrix4f, offset, offset + iconSize, 0.01F)
                          .color(255, 255, 255, 255)
                          .texture(0.0F, 1.0F)
                          .light(light);
            vertexConsumer.vertex(matrix4f, offset + iconSize, offset + iconSize, 0.01F)
                          .color(255, 255, 255, 255)
                          .texture(1.0F, 1.0F)
                          .light(light);
            vertexConsumer.vertex(matrix4f, offset + iconSize, offset, 0.01F)
                          .color(255, 255, 255, 255)
                          .texture(1.0F, 0.0F)
                          .light(light);

            matrices.pop();
        }
    }
}
