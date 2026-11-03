"""Graph neural network that predicts segment Impact Scores (plain PyTorch, no PyG).

Nodes are road intersections, edges are road segments. Node states are updated by mean-aggregated
messages from neighbours that include the connecting segment's features; a segment's score is read
out from the states of its two endpoints plus its own features.
"""
import torch
from torch import nn


class EdgeConv(nn.Module):
    def __init__(self, dim: int, edge_dim: int):
        super().__init__()
        self.msg = nn.Sequential(nn.Linear(dim + edge_dim, dim), nn.ReLU())
        self.upd = nn.Linear(2 * dim, dim)
        self.norm = nn.LayerNorm(dim)

    def forward(self, h, src, dst, e, deg):
        m = self.msg(torch.cat([h[src], e], dim=-1))
        agg = torch.zeros_like(h).index_add_(0, dst, m) / deg
        return self.norm(h + torch.relu(self.upd(torch.cat([h, agg], dim=-1))))


class ImpactGNN(nn.Module):
    def __init__(self, node_dim: int, edge_dim: int, hidden: int = 64, layers: int = 4):
        super().__init__()
        self.inp = nn.Linear(node_dim, hidden)
        self.layers = nn.ModuleList(EdgeConv(hidden, edge_dim) for _ in range(layers))
        self.head = nn.Sequential(nn.Linear(3 * hidden + edge_dim, hidden), nn.ReLU(), nn.Linear(hidden, 1))

    def forward(self, x, u, v, edge_x):
        # Undirected: messages flow both ways along every segment.
        src = torch.cat([u, v])
        dst = torch.cat([v, u])
        e2 = torch.cat([edge_x, edge_x])
        deg = torch.zeros(x.shape[0], 1).index_add_(0, dst, torch.ones(len(dst), 1)).clamp(min=1)
        h = torch.relu(self.inp(x))
        for layer in self.layers:
            h = layer(h, src, dst, e2, deg)
        hu, hv = h[u], h[v]
        return self.head(torch.cat([hu + hv, hu * hv, (hu - hv).abs(), edge_x], dim=-1)).squeeze(-1)
