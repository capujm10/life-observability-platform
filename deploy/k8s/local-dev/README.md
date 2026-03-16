# Local k3d Deployment

This manifest set targets a local k3d or k3s cluster with Traefik already running and PostgreSQL already available at `postgres.database.svc:5432`.

## Scope

- Namespace: `dev`
- Backend image: `ghcr.io/capujm10/life-observability-platform-backend:4f055c29907d7cb8a9c833a260d9005390b5ea5d`
- Frontend image: `ghcr.io/capujm10/life-observability-platform-frontend:4f055c29907d7cb8a9c833a260d9005390b5ea5d`
- Postgres dependency: existing service `postgres.database.svc:5432`

## Expected Local URL

- Frontend: `http://lop.localhost:8080`
- API health check: `http://lop.localhost:8080/api/v1/health`

`.localhost` usually resolves to loopback without editing `/etc/hosts`. Only add a hosts entry if your machine does not resolve `lop.localhost`.

## Apply Order

```bash
kubectl apply -f deploy/k8s/local-dev/namespace.yaml
kubectl apply -f deploy/k8s/local-dev/secret.yaml
kubectl apply -f deploy/k8s/local-dev/backend-deployment.yaml
kubectl apply -f deploy/k8s/local-dev/backend-service.yaml
kubectl apply -f deploy/k8s/local-dev/frontend-deployment.yaml
kubectl apply -f deploy/k8s/local-dev/frontend-service.yaml
kubectl apply -f deploy/k8s/local-dev/ingress.yaml
```

## Verify

```bash
kubectl get pods -n dev
kubectl get svc -n dev
kubectl get ingress -n dev
kubectl rollout status deployment/lop-backend -n dev
kubectl rollout status deployment/lop-frontend -n dev
```

Backend check:

```bash
curl -H "Host: lop.localhost" http://127.0.0.1:8080/api/v1/health
```

Frontend check:

- Open `http://lop.localhost:8080/login`

Logs:

```bash
kubectl logs -n dev deployment/lop-backend -f
kubectl logs -n dev deployment/lop-frontend -f
```

## Notes

- The local-dev secret is committed on purpose because these are disposable local cluster values.
- The frontend now falls back to `${window.location.origin}/api/v1` in the browser when `NEXT_PUBLIC_API_BASE_URL` is not baked into the image, so `lop.localhost:8080` works for local ingress-based access.
- A rollout restart alone will not fix an older frontend image that was already built with `http://localhost:8000/api/v1` baked into the bundle. Publish a new frontend image, update the tag in `frontend-deployment.yaml`, then re-apply the deployment.
- If the GHCR packages are private, create `ghcr-pull-secret` in namespace `dev` and uncomment `imagePullSecrets` in both deployment manifests.
- If you publish a newer image, replace the pinned SHA tags in the deployment manifests before applying them.
