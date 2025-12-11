import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, Observable, switchMap, throwError } from "rxjs";
import { AuthService } from "../../auth/services/auth.service";


export function LoginInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const token: string = localStorage.getItem("token") ?? '';
  const authService = inject(AuthService);

  // Skip authentication for public routes
  if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/refresh')) {
    return next(req);
  }

  // Get selected company from localStorage
  const selectedCompanyStr = localStorage.getItem("selectedCompany");
  let companyId: number | null = null;

  if (selectedCompanyStr) {
    try {
      const selectedCompany = JSON.parse(selectedCompanyStr);
      companyId = selectedCompany.id;
    } catch (e) {
      console.error('Error parsing selectedCompany from localStorage:', e);
    }
  }

  // Clone request and add headers
  let headers = req.headers.set('Authorization', `Bearer ${token}`);

  // Add X-Company-Id header if company is selected
  if (companyId !== null) {
    headers = headers.set('X-Company-Id', companyId.toString());
  }
  
  const reqWithHeader = req.clone({ headers });

  return next(reqWithHeader).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {

        return authService.refreshToken().pipe(
          switchMap(newToken => {

            let newHeaders = req.headers.set('Authorization', `Bearer ${newToken.token}`);

            // Add X-Company-Id header again for retry
            if (companyId !== null) {
              newHeaders = newHeaders.set('X-Company-Id', companyId.toString());
            }

            const reqWithNewToken = req.clone({ headers: newHeaders });

            return next(reqWithNewToken);
          }),
          catchError(err => {
            console.error('Error refreshing token:', err);
            return throwError(()=>err);
          })
        );
      }

      return throwError(()=>error);
    })
  );
}
