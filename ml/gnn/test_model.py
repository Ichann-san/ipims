import torch

from ml.gnn.model import ImpactGNN


def test_forward_shapes_and_symmetry():
    torch.manual_seed(0)
    model = ImpactGNN(node_dim=3, edge_dim=2, hidden=8, layers=2)
    x = torch.randn(4, 3)
    u, v = torch.tensor([0, 1, 2]), torch.tensor([1, 2, 3])
    e = torch.randn(3, 2)
    out = model(x, u, v, e)
    assert out.shape == (3,)
    # Swapping segment endpoints must not change the prediction (roads are undirected).
    assert torch.allclose(out, model(x, v, u, e), atol=1e-5)
