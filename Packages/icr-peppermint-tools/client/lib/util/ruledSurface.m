function [cz,c1i,c2i,totalEdgeLength] = ruledSurface(c1,c2,zInterp)

%% I'm guessing [cz,c1i,c2i,totalEdgeLength] is the output.


c1 = {
 x: [0.0, 0.0, 1.0, 1.0, 0.0],
 y: [0.0, 1.0, 1.0, 0.0, 0.0],
 z: [0.0, 0.0, 0.0, 0.0, 0.0]
}

c2 = {
 x: [0.0, 0.0, 1.0, 1.0, 0.5, 0.0],
 y: [0.0, 1.0, 1.0, 0.0. 0.0, 0.0],
 z: [2.0, 2.0, 2.0, 2.0. 2.0, 2.0]
}

zInterp = 1.0

% assumes input polygons are closed and that they are in x-y plane at
% different z locations

% interpolate each edge uniformly so that there are the same number of
% vertices in both polygons

% make sure both go clockwise
% this is code ripped from ispolycw.m
%% TODO This condition obviously works out something to do with the turning number.
%% Get c1.x mean
%% Sum the values diff from the mean.
%% calc the diff between some y elements, will understand once I get the i and j declerations.
n = numel(c1.x) - 1;  %% Returns the number of elements in c1.x
i = [2:n 1]; %% 2, 4, 6 ... N, 1, 2
j = [3:n 1 2]; %% 3, 4, ..., N, 1, 2 3
k = (1:n); %% 1...N

if sum((c1.x(i)-mean(c1.x(1:n))) .* (c1.y(j) - c1.y(k)))>0
    c1.x = flipud(c1.x); %% Reverse the array -> js: c1.x.reverse()
    c1.y = flipud(c1.y);
end
%
n = numel(c2.x) - 1;
i = [2:n 1];
j = [3:n 1 2];
k = (1:n);
if sum((c2.x(i)-mean(c2.x(1:n))) .* (c2.y(j) - c2.y(k)))>0
    c2.x = flipud(c2.x);
    c2.y = flipud(c2.y);
end


% perimeter distance from initial vertex
perim1 = [0; cumsum(sqrt(diff(c1.x).^2+diff(c1.y).^2))]; %% column vector of cumulative perimeter.
perim2 = [0; cumsum(sqrt(diff(c2.x).^2+diff(c2.y).^2))];

dP = 0.2; % aim for less than 0.2mm between interpolation points
interpPoints = max([ceil(perim1(end)/dP) ceil(perim2(end)/dP)]); %% ceil -> rounds up nearest int

% normalised perimeter
perim1n = perim1/perim1(end); %%Last element
perim2n = perim2/perim2(end);

% make interpPoints uniformly spaced along contour, and add back the
% original points for each polygon
% use indicator array to keep track of which points correspond to the
% original polygons
p1 = linspace(0,1,interpPoints+length(c2.x))'; %' transpose  , linspace -> equally spaced between first 2 args
perim1interp = [p1(2:end-1); perim1n]; % concatenated column vectors.
perim1ind = [false(interpPoints+length(c2.x)-2,1); true(length(c1.x),1)];  % concatenated column vectors.
p2 = linspace(0,1,interpPoints+length(c1.x))';
perim2interp = [p2(2:end-1); perim2n];
perim2ind = [false(interpPoints+length(c1.x)-2,1); true(length(c2.x),1)];

% sort perimeter and get number of points for each original edge
% a = perim1ind(idx1) -> reorder array based off index array idx1
% b = find(a) -> returns indicies of non-zero elements
% diff(b) -> returns an array of number of elements between indicies.
[~,idx1] = sort(perim1interp); %% Generates an array of indicies corresponding to ascending values.
nPerSeg1 = diff(find(perim1ind(idx1))); %% find returns the indicies of the non zero elements. nPerSeg1 => number of interpolated verticies per original line segment.
[~,idx2] = sort(perim2interp);
nPerSeg2 = diff(find(perim2ind(idx2)));

% make interpolated polygons - these will be open polygons -> Because we are only working out the verticies.
c1i.x = [];
c1i.y = [];
c1i.I = logical([]); % Typed logical array
for n = 1:length(c1.x)-1 % => -1 because we originally had a duplicate (closed contours).
    x = linspace(c1.x(n),c1.x(n+1),nPerSeg1(n)+1)';
    c1i.x = [c1i.x; x(1:end-1)];
    y = linspace(c1.y(n),c1.y(n+1),nPerSeg1(n)+1)';
    c1i.y = [c1i.y; y(1:end-1)];
    % indicator of original polygon vertices
    c1i.I = [c1i.I; [true; false(nPerSeg1(n)-1,1)]];
end
c1i.z = c1.z(1)*ones(size(c1i.x));
%
c2i.x = [];
c2i.y = [];
c2i.I = logical([]);
for n = 1:length(c2.x)-1
    x = linspace(c2.x(n),c2.x(n+1),nPerSeg2(n)+1)';
    c2i.x = [c2i.x; x(1:end-1)];
    y = linspace(c2.y(n),c2.y(n+1),nPerSeg2(n)+1)';
    c2i.y = [c2i.y; y(1:end-1)];
    % indicator of original polygon vertices
    c2i.I = [c2i.I; [true; false(nPerSeg2(n)-1,1)]];
end
c2i.z = c2.z(1)*ones(size(c2i.x));

%% TODO TODO TODO => UP TO HERE!

% test all correspondances between points on the two interpolated polygons
% do circular shifting using toeplitz matrices to avoid for loop
X = toeplitz(c1i.x,[c1i.x(1) flipud(c1i.x(2:end))']);
Y = toeplitz(c1i.y,[c1i.y(1) flipud(c1i.y(2:end))']);
Z = toeplitz(c1i.z,[c1i.z(1) flipud(c1i.z(2:end))']);
II = double(c1i.I);
I = toeplitz(II,[II(1) flipud(II(2:end))'])==1;
totalEdgeLength = sum((X-c2i.x).^2 + (Y-c2i.y).^2 + (Z-c2i.z).^2);

% select correspondance with minimum total edge length
% have also tested minimum area, but takes longer to compute, and doesn't
% seem to make much difference
[~,optShift] = min(totalEdgeLength);
c1i.x = X(:,optShift);
c1i.y = Y(:,optShift);
c1i.z = Z(:,optShift);
c1i.I = I(:,optShift);

% only points that connect to original polygon points are needed
ind = c1i.I | c2i.I;
c1i.x = c1i.x(ind);
c1i.y = c1i.y(ind);
c1i.z = c1i.z(ind);
c1i.I = c1i.I(ind);
%
c2i.x = c2i.x(ind);
c2i.y = c2i.y(ind);
c2i.z = c2i.z(ind);
c2i.I = c2i.I(ind);

% close interpolated polygons
c1i.x(end+1) = c1i.x(1);
c1i.y(end+1) = c1i.y(1);
c1i.z(end+1) = c1i.z(1);
c1i.I(end+1) = c1i.I(1);
c2i.x(end+1) = c2i.x(1);
c2i.y(end+1) = c2i.y(1);
c2i.z(end+1) = c2i.z(1);
c2i.I(end+1) = c2i.I(1);

% check the ruled surface for self intersections by making multiple
% contours interpolated between slices and seeing if they are
% non-intersecting contours
% cz.selfIntersectingSurface = false;
% for w = linspace(0,1,10)
%     cI.x = (1-w)*c1i.x + w*c2i.x;
%     cI.y = (1-w)*c1i.y + w*c2i.y;
%     % find intersection points of polygon with itself
%     % if non-intersecting then will be the same as itself
%     [xi,yi] = polyxpoly(cI.x,cI.y,cI.x,cI.y);
%     cz.selfIntersectingSurface = cz.selfIntersectingSurface | ~isempty(setdiff([xi yi],[cI.x cI.y],'rows'));
% end
cz.selfIntersectingSurface = false;

% make interpolated polygon if requested by input of new z location
if nargin==3
    w = (zInterp - c1.z(1))/(c2.z(1)-c1.z(1));
    cz.x = (1-w)*c1i.x + w*c2i.x;
    cz.y = (1-w)*c1i.y + w*c2i.y;
    cz.z = (1-w)*c1i.z + w*c2i.z;
    cz.I1 = c1i.I;
    cz.I2 = c2i.I;
    % indicate if this polygon is
%     [xi,yi] = polyxpoly(cz.x,cz.y,cz.x,cz.y,'unique');
%     cz.selfIntersectingPolygon = ~isempty(setdiff([xi yi],[cz.x cz.y],'rows'));
     cz.selfIntersectingPolygon = false;
else
    cz = [];
end
