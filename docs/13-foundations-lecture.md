# Foundations: chapter lecture transcript

Original course narration. Voice: Microsoft Mitchell Neural, English (New Zealand), generated with edge-tts. The text below is the exact spoken script; the module includes additional equations, tables, code, and lab guidance. Each chapter is an intentional pause point for exploration and practice.

## 1. From familiar models to neural training

Welcome to the training lab. We will build from ideas you already know, rather than start with a test. Think about fitting a model in a simulation or a least-squares problem. You choose parameters, compute predictions, measure a discrepancy, and adjust the parameters. Deep-learning training follows the same broad pattern. The prediction function is now a composition of differentiable operations, and the loss must match the task.

Our first example is classification. A small neural network takes two input features, transforms them into hidden features, applies a nonlinearity, and produces two output scores. Those scores are called logits. The learned weights and biases are parameters. The intermediate values computed for an input are activations.

The nonlinearity is essential. Composing only linear transformations still gives a linear transformation. Adding layers alone does not change that fact. A rectified linear unit, or ReLU, keeps positive values and replaces negative values with zero.

By the end of this module, you should be able to explain one complete training update and recognize when an implementation is wrong. We will work through a concrete example before asking you to implement a fresh one.

## 2. Track the shapes

Before running a neural network, make its tensor shapes explicit. Imagine a batch of four examples, each with two input features. The input has four rows and two columns. The first transformation maps two features to eight hidden features. After the nonlinearity, the hidden activation has four rows and eight columns. The final transformation produces two scores per example, so the logits have four rows and two columns.

There are four labels, each an integer identifying the correct class. The mean loss is a single scalar. These axis meanings matter as much as the dimensions themselves.

For this mathematical arrangement, the first weight matrix contains sixteen values, its bias contains eight, the second weight matrix contains sixteen, and the final bias contains two. That is forty-two learned parameters. Changing the batch size changes the activation sizes, but it does not change those forty-two parameters.

Pause here and draw the sequence of shapes. If an agent gives you code, use that drawing to review it. A broadcast operation can succeed without implementing the computation you intended.

## 3. From logits to loss

Logits are unnormalized scores. Softmax turns them into probabilities by exponentiating each score and dividing by the sum of exponentials. For scores equal to the natural logarithm of three, and zero, the probabilities are three quarters and one quarter.

For a correct class, cross-entropy is the negative natural logarithm of its predicted probability. In our first example, class zero is correct and has probability three quarters. Its loss is about zero point two eight eight. In the second example, both scores are zero, so both classes have probability one half. If class one is correct, its loss is about zero point six nine three. Averaging the two examples gives about zero point four nine zero four one five.

Now consider numerical stability. We can subtract the largest logit from every logit in its row before exponentiating. This common shift changes neither the probabilities nor the mathematical loss. Computing log probabilities directly also avoids taking the logarithm of a value that has already rounded to zero.

After listening, open the softmax sandbox. Change temperature while keeping the scores fixed. Observe the distribution change, and remember that changing sampling behavior is not training the weights.

## 4. Understand the gradient

The gradient tells us how a small change in a parameter or intermediate value changes the loss. For one example, softmax cross-entropy has a particularly useful logit gradient: predicted probability minus the target indicator. If the correct class has target one, subtract one from its probability. The other class has target zero.

For a mean batch loss, divide each example's contribution by the batch size. Our first example therefore gives negative zero point one two five for the correct-class logit, and positive zero point one two five for the other. The uncertain second example gives positive zero point two five for class zero, and negative zero point two five for its correct class.

These signs make sense. Gradient descent subtracts the gradient. It therefore raises the correct-class score and lowers the incorrect-class score in this simple example.

Autograd carries this signal through the network using the chain rule. It does not know whether the labels or loss reduction are the ones you intended. We still need an independent check. Perturb one logit slightly in each direction and measure the difference in loss. That centered finite difference should agree closely with the analytical gradient in a small deterministic float-sixty-four calculation.

## 5. Run and inspect the worked example

The repository contains a complete numerical walkthrough that runs on a CPU with NumPy. Read the source alongside the module, then run it in your development environment. It checks the known two-example loss, the analytical gradient, a numerical gradient, constant-shift invariance, and an extreme-logit case.

The starting mean loss should print zero point four nine zero four one five. A small descent step should reduce that loss. When a model assigns a logit of one thousand to the wrong class and negative one thousand to the correct class, the stable loss should be two thousand, not infinity.

This program changes the logits directly to illustrate the direction of improvement. A real neural training loop changes model parameters through the chain rule. Keep that distinction clear.

Now make one controlled change. Swap a label and predict the gradient signs before rerunning. Then replace the mean reduction with a sum and predict the scaling factor. Finally, add a common constant to the logits and explain which quantities must remain unchanged. These small transfer exercises establish whether you understand why the checks pass.

## 6. Connect the calculation to a training loop

A PyTorch training step has a clear sequence. Put the model in training mode. Clear gradients unless you deliberately intend to accumulate them. Compute logits from the batch. Compute cross-entropy using those raw logits and integer labels. Run backward, then let the optimizer update the parameters.

Each operation has a distinct responsibility. Training mode configures layers such as dropout. Clearing gradients prevents accidental accumulation. The forward computation constructs predictions and the graph. Backward applies the chain rule. The optimizer uses gradients and possibly historical state to update weights.

Evaluation mode and disabling gradient recording are different choices. One changes layer behavior; the other changes whether a graph is recorded. Neither verifies that your validation set is independent of training data.

Before comparing sophisticated optimizers, show that the same small batch can be fitted. If it cannot, inspect labels, reductions, graph connectivity, and update order. Once those are correct, compare optimizer settings under an explicit budget. Remember to save optimizer state when you want a faithful training resume. Saving weights alone may reproduce predictions but not the next update.

## 7. Use controls to understand the result

A convincing loss curve is not enough. We need controls that tell us what the training system can actually do. First, deliberately overfit a tiny batch. Success demonstrates that the model and optimizer can fit that small case. It does not demonstrate generalization.

Next, randomize training labels and compare with a protected evaluation set. A flexible model may memorize arbitrary labels while failing on new examples. This separates the ability to reduce training loss from learning a useful predictive rule.

In the image lab, you will generate horizontal and vertical bars, add shifts and noise, and compare a small convolutional network with an MLP. Hold out some positions or noise settings so the test asks a meaningful transfer question.

When a result is surprising, diagnose it. Implausibly perfect validation may indicate leakage. Oscillating loss may suggest an excessive learning rate, but inspect other evidence before concluding that. Growing memory may mean the program is retaining graphs. Keep the smallest failure and test competing explanations one at a time.

Use the gradient-descent sandbox after this chapter to see stability change on a simple quadratic. Then explain why its exact learning-rate boundary does not apply universally to neural networks.

## 8. Build and demonstrate your understanding

You now have a complete path from model specification to loss, gradient, update, and evaluation. The next step is hands-on work. Open the four dedicated foundation labs in order. Each page contains its own guidance, expected observations, troubleshooting, and evidence requirements.

You can use agents to scaffold code and help investigate a failure. Your responsibility is to specify the task, predict outcomes, inspect the critical calculations, and defend the interpretation. We will use a fresh small transfer task to check what you understand independently.

Only after working through the explanation should you use the short theory questions. They are retrieval practice for selected concepts, not a certificate that you can train models reliably.

For the final foundation gate, derive or verify a gradient on a fresh example, repair an injected training bug, and explain the difference between fitting and generalizing. Bring the code, exact commands, actual observations, and your explanation to the tutor. A measured failure with a sound diagnosis is more informative than an unexplained attractive plot.
