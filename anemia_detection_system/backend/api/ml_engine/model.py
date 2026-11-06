"""
Multimodal neural network architecture for Anemia Detection.

AnemiaMultimodalNet fuses features from two image branches (conjunctiva
and fingernail images via ResNet-50) with a tabular clinical data branch
to produce a single anemia risk probability.
"""

import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights


class AnemiaMultimodalNet(nn.Module):
    """
    Multimodal model for anemia risk prediction.

    Architecture:
        - Conjunctiva image branch:  ResNet-50 backbone → 2048-d features
        - Fingernail image branch:   ResNet-50 backbone → 2048-d features
        - Tabular clinical branch:   MLP (128 → 256 → 128)
        - Fusion head:               Concat (2048+2048+128=4224) → 512 → 1 → Sigmoid
    """

    def __init__(self):
        super(AnemiaMultimodalNet, self).__init__()

        # --- Image branch for conjunctiva ---
        conjunctiva_backbone = resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
        # Strip the final fully connected layer, keeping the 2048-d feature extractor
        self.conjunctiva_branch = nn.Sequential(
            *list(conjunctiva_backbone.children())[:-1],  # up to avgpool
            nn.Flatten(),  # (batch, 2048, 1, 1) -> (batch, 2048)
        )

        # --- Image branch for fingernails ---
        fingernail_backbone = resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
        self.fingernail_branch = nn.Sequential(
            *list(fingernail_backbone.children())[:-1],
            nn.Flatten(),
        )

        # --- Tabular branch for clinical data ---
        self.tabular_mlp = nn.Sequential(
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
        )

        # --- Fusion head ---
        # Concatenated features: 2048 (conjunctiva) + 2048 (fingernail) + 128 (tabular) = 4224
        self.fusion_head = nn.Sequential(
            nn.Linear(4224, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 1),
            nn.Sigmoid(),
        )

    def forward(
        self,
        conjunctiva_img: torch.Tensor,
        fingernail_img: torch.Tensor,
        clinical_data: torch.Tensor,
    ) -> torch.Tensor:
        """
        Forward pass through the multimodal network.

        Args:
            conjunctiva_img: Tensor of shape (batch, 3, 224, 224).
            fingernail_img:  Tensor of shape (batch, 3, 224, 224).
            clinical_data:   Tensor of shape (batch, 128).

        Returns:
            Tensor of shape (batch, 1) with sigmoid probability [0, 1].
        """
        # Extract image features
        conj_features = self.conjunctiva_branch(conjunctiva_img)  # (batch, 2048)
        nail_features = self.fingernail_branch(fingernail_img)    # (batch, 2048)

        # Process tabular data
        tab_features = self.tabular_mlp(clinical_data)            # (batch, 128)

        # Concatenate all features
        fused = torch.cat([conj_features, nail_features, tab_features], dim=1)  # (batch, 4224)

        # Predict risk score
        output = self.fusion_head(fused)  # (batch, 1)
        return output

