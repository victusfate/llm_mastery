"""A complete, CPU-only numerical walkthrough; requires NumPy."""
import numpy as np


def cross_entropy(logits, labels):
    logits = np.asarray(logits, dtype=np.float64)
    labels = np.asarray(labels)
    if logits.ndim != 2 or len(logits) == 0 or labels.shape != (len(logits),):
        raise ValueError('Expected nonempty B×V logits and B labels')
    if not np.isfinite(logits).all() or not np.issubdtype(labels.dtype, np.integer):
        raise ValueError('Use finite logits and integer labels')
    if np.any(labels < 0) or np.any(labels >= logits.shape[1]):
        raise ValueError('Class label out of bounds')
    shifted = logits - logits.max(axis=1, keepdims=True)
    log_probs = shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))
    loss = -log_probs[np.arange(len(labels)), labels].mean()
    gradient = np.exp(log_probs)
    gradient[np.arange(len(labels)), labels] -= 1
    gradient /= len(labels)
    return float(loss), gradient


def numerical_gradient(logits, labels, step=1e-5):
    result = np.zeros_like(logits, dtype=np.float64)
    for index in np.ndindex(logits.shape):
        plus, minus = logits.copy(), logits.copy()
        plus[index] += step
        minus[index] -= step
        result[index] = (cross_entropy(plus, labels)[0] - cross_entropy(minus, labels)[0]) / (2 * step)
    return result


def walkthrough():
    logits = np.array([[np.log(3.), 0.], [0., 0.]])
    labels = np.array([0, 1])
    loss, gradient = cross_entropy(logits, labels)
    expected_gradient = np.array([[-.125, .125], [.25, -.25]])
    expected_loss = (-np.log(.75) - np.log(.5)) / 2
    np.testing.assert_allclose(loss, expected_loss, atol=1e-12)
    np.testing.assert_allclose(gradient, expected_gradient, atol=1e-12)
    np.testing.assert_allclose(gradient, numerical_gradient(logits, labels), atol=1e-8)
    shifted_loss, shifted_gradient = cross_entropy(logits + 1000, labels)
    np.testing.assert_allclose(shifted_loss, loss, atol=1e-12)
    np.testing.assert_allclose(shifted_gradient, gradient, atol=1e-12)
    extreme_loss, _ = cross_entropy(np.array([[1000., -1000.]]), np.array([1]))
    assert extreme_loss == 2000.0
    updated_loss, _ = cross_entropy(logits - .1 * gradient, labels)
    assert updated_loss < loss
    print(f'Initial mean loss: {loss:.6f}')
    print(f'Gradient:\n{gradient}')
    print(f'After a small logit descent step: {updated_loss:.6f}')
    print('Analytical values, finite differences, constant shift, and extreme-logit checks passed.')
    print('This updates logits as a teaching example, not the parameters of a complete neural network.')


if __name__ == '__main__':
    walkthrough()
