# k3s Deployment Runbook

This runbook is the practical path for deploying Life Observability Platform to a lightweight k3s cluster without Helm.

## Prerequisites

- `kubectl` points to the target k3s cluster
- the GHCR publish workflow has already produced backend and frontend images
- you have chosen whether to deploy `latest` or a specific Git SHA tag

Namespace used by the manifests:

```bash
export NS=life-observability-platform
```

## Recommended Images

Prefer SHA-pinned images for real deployments:

- `ghcr.io/capujm10/life-observability-platform-backend:<git-sha>`
- `ghcr.io/capujm10/life-observability-platform-frontend:<git-sha>`

`latest` is acceptable only for quick MVP iterations.

## Step 1: Create the Namespace

```bash
kubectl apply -f deploy/k8s/namespace.yaml
```

## Step 2: Prepare the Application Secret

Copy `deploy/k8s/secret.example.yaml` to a real file such as `deploy/k8s/secret.yaml`, then replace:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_BASE_URL`
- `GITHUB_API_TOKEN` if GitHub sync should be enabled

Apply the secret:

```bash
cp deploy/k8s/secret.example.yaml deploy/k8s/secret.yaml
# edit deploy/k8s/secret.yaml
kubectl apply -f deploy/k8s/secret.yaml
```

Keep `deploy/k8s/secret.yaml` local and untracked. The committed template is `deploy/k8s/secret.example.yaml`.
The manifests expect the real secret name to be `lop-secret`.

## Step 3: Optional GHCR Pull Secret

Only needed if the GHCR packages are private.

Create the registry secret:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace "$NS" \
  --docker-server=ghcr.io \
  --docker-username="<github-username>" \
  --docker-password="<ghcr-read-token>"
```

Then uncomment the `imagePullSecrets` block in:

- `deploy/k8s/backend.yaml`
- `deploy/k8s/frontend.yaml`

## Step 4: Confirm the Ingress Host

The ingress is currently set to the first deployment hostname:

- `186.177.187.155.nip.io`

If the public endpoint changes later, update `deploy/k8s/ingress.yaml`, `CORS_ORIGINS`, and `NEXT_PUBLIC_API_BASE_URL` together.

## Step 5: Review the Pinned Image SHAs

The manifests are already pinned to a published release SHA. Before rollout, confirm those tags are the ones you want to run, or replace them with a newer published Git SHA tag in:

- `deploy/k8s/backend.yaml`
- `deploy/k8s/frontend.yaml`

Example:

- `ghcr.io/capujm10/life-observability-platform-backend:abc123...`
- `ghcr.io/capujm10/life-observability-platform-frontend:def456...`

The backend and frontend manifests include an inline comment above the image field as a reminder.

## Step 6: Apply Resources in Order

```bash
kubectl apply -f deploy/k8s/postgres-pvc.yaml
kubectl apply -f deploy/k8s/postgres.yaml
kubectl apply -f deploy/k8s/backend.yaml
kubectl apply -f deploy/k8s/frontend.yaml
kubectl apply -f deploy/k8s/ingress.yaml
```

## Verify the Deployment

Check pods:

```bash
kubectl get pods -n "$NS"
kubectl get pods -n "$NS" -w
```

Check services and ingress:

```bash
kubectl get svc -n "$NS"
kubectl get ingress -n "$NS"
```

Check rollout status:

```bash
kubectl rollout status deployment/lop-postgres -n "$NS"
kubectl rollout status deployment/lop-backend -n "$NS"
kubectl rollout status deployment/lop-frontend -n "$NS"
```

Inspect pod details if something is not ready:

```bash
kubectl describe pod -n "$NS" <pod-name>
```

## Logs and Troubleshooting

Tail backend logs:

```bash
kubectl logs -n "$NS" deployment/lop-backend -f
```

Tail frontend logs:

```bash
kubectl logs -n "$NS" deployment/lop-frontend -f
```

Tail Postgres logs:

```bash
kubectl logs -n "$NS" deployment/lop-postgres -f
```

Common checks:

```bash
kubectl get events -n "$NS" --sort-by=.metadata.creationTimestamp
kubectl describe deployment lop-backend -n "$NS"
kubectl describe deployment lop-frontend -n "$NS"
kubectl describe deployment lop-postgres -n "$NS"
```

## Restart a Deployment

```bash
kubectl rollout restart deployment/lop-backend -n "$NS"
kubectl rollout restart deployment/lop-frontend -n "$NS"
```

## Roll Out a New Image Tag

Use `kubectl set image` for fast updates:

```bash
kubectl set image deployment/lop-backend \
  backend=ghcr.io/capujm10/life-observability-platform-backend:<git-sha> \
  -n "$NS"

kubectl set image deployment/lop-frontend \
  frontend=ghcr.io/capujm10/life-observability-platform-frontend:<git-sha> \
  -n "$NS"
```

Then verify:

```bash
kubectl rollout status deployment/lop-backend -n "$NS"
kubectl rollout status deployment/lop-frontend -n "$NS"
```

If you want the manifests to remain the source of truth, update the image tags in the YAML after the rollout as well.
